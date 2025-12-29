import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate cost forecasts based on historical usage patterns
 * Uses linear regression with trend analysis
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      scope = 'organization',
      scope_id = null,
      forecast_period = '30_days',
      lookback_days = 30,
    } = await req.json();

    const now = new Date();
    const lookbackDate = new Date(now.getTime() - (lookback_days * 24 * 60 * 60 * 1000));

    // Fetch historical metrics
    let metricsFilter = {
      timestamp: { $gte: lookbackDate.toISOString() },
      org_id: user.organization.id,
    };

    if (scope === 'agent' && scope_id) {
      metricsFilter.agent_id = scope_id;
    } else if (scope === 'workflow' && scope_id) {
      metricsFilter.workflow_id = scope_id;
    }

    const metrics = await base44.asServiceRole.entities.AgentMetric.filter(
      metricsFilter,
      'timestamp',
      10000
    );

    if (metrics.length < 7) {
      return Response.json({
        error: 'Insufficient historical data for forecasting',
        hint: 'Need at least 7 days of usage data',
      }, { status: 400 });
    }

    // Aggregate by day
    const dailySpend = aggregateByDay(metrics);
    
    // Calculate statistics
    const stats = calculateStatistics(dailySpend);
    
    // Generate forecast
    const forecastDays = {
      '7_days': 7,
      '30_days': 30,
      '90_days': 90,
    }[forecast_period];

    const forecast = generateForecast(dailySpend, forecastDays, stats);

    // Store forecast
    const forecastRecord = await base44.asServiceRole.entities.CostForecast.create({
      scope,
      scope_id,
      forecast_period,
      forecast_date: now.toISOString(),
      historical_days: lookback_days,
      current_daily_avg_cents: stats.avgDailyCents,
      predicted_daily_avg_cents: forecast.predictedDailyAvg,
      predicted_total_cents: forecast.totalPredicted,
      confidence_score: forecast.confidence,
      trend: stats.trend,
      daily_breakdown: forecast.dailyBreakdown,
      org_id: user.organization.id,
    });

    return Response.json({
      success: true,
      forecast: forecastRecord,
      insights: {
        current_daily_avg: `$${(stats.avgDailyCents / 100).toFixed(2)}`,
        predicted_monthly: `$${(forecast.totalPredicted / 100).toFixed(2)}`,
        trend: stats.trend,
        confidence: `${(forecast.confidence * 100).toFixed(0)}%`,
      },
    });

  } catch (error) {
    console.error('Forecast error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `FORECAST_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

function aggregateByDay(metrics) {
  const dailyMap = new Map();

  for (const metric of metrics) {
    const date = new Date(metric.timestamp).toISOString().split('T')[0];
    const current = dailyMap.get(date) || 0;
    dailyMap.set(date, current + (metric.cost_cents || 0));
  }

  return Array.from(dailyMap.entries())
    .map(([date, cents]) => ({ date, cents }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateStatistics(dailySpend) {
  const values = dailySpend.map(d => d.cents);
  const sum = values.reduce((a, b) => a + b, 0);
  const avgDailyCents = Math.round(sum / values.length);
  
  // Calculate trend using simple linear regression
  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const xSum = xValues.reduce((a, b) => a + b, 0);
  const ySum = sum;
  const xySum = xValues.reduce((acc, x, i) => acc + (x * values[i]), 0);
  const xxSum = xValues.reduce((acc, x) => acc + (x * x), 0);
  
  const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
  
  let trend = 'stable';
  if (slope > avgDailyCents * 0.05) trend = 'increasing';
  else if (slope < -avgDailyCents * 0.05) trend = 'decreasing';

  // Calculate standard deviation for confidence
  const variance = values.reduce((acc, val) => acc + Math.pow(val - avgDailyCents, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avgDailyCents;

  return {
    avgDailyCents,
    slope,
    trend,
    stdDev,
    coefficientOfVariation,
  };
}

function generateForecast(dailySpend, forecastDays, stats) {
  const { avgDailyCents, slope, stdDev, coefficientOfVariation } = stats;
  
  // Confidence is inversely proportional to variation
  const confidence = Math.max(0.5, Math.min(0.95, 1 - coefficientOfVariation));
  
  const dailyBreakdown = [];
  const lastDate = new Date(dailySpend[dailySpend.length - 1].date);
  
  let totalPredicted = 0;

  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(lastDate.getTime() + (i * 24 * 60 * 60 * 1000));
    const predicted = Math.round(avgDailyCents + (slope * (dailySpend.length + i)));
    
    // Add uncertainty bounds
    const lowerBound = Math.max(0, Math.round(predicted - (2 * stdDev)));
    const upperBound = Math.round(predicted + (2 * stdDev));
    
    dailyBreakdown.push({
      date: forecastDate.toISOString().split('T')[0],
      predicted_cents: predicted,
      lower_bound_cents: lowerBound,
      upper_bound_cents: upperBound,
    });
    
    totalPredicted += predicted;
  }

  const predictedDailyAvg = Math.round(totalPredicted / forecastDays);

  return {
    dailyBreakdown,
    totalPredicted,
    predictedDailyAvg,
    confidence,
  };
}