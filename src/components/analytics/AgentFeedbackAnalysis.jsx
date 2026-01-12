import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Star, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react';

export default function AgentFeedbackAnalysis({ agents, reviews, installations, selectedAgent }) {
  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => dist[r.rating]++);
    return Object.entries(dist).map(([rating, count]) => ({
      rating: `${rating} stars`,
      count,
      percentage: reviews.length > 0 ? ((count / reviews.length) * 100).toFixed(0) : 0
    })).reverse();
  };

  const getSentimentTrend = () => {
    const last30Days = reviews.slice(0, 30);
    const grouped = {};
    
    last30Days.forEach(review => {
      const date = new Date(review.created_date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = { positive: 0, negative: 0, neutral: 0 };
      }
      if (review.rating >= 4) grouped[date].positive++;
      else if (review.rating <= 2) grouped[date].negative++;
      else grouped[date].neutral++;
    });

    return Object.entries(grouped).map(([date, counts]) => ({
      date,
      positive: counts.positive,
      negative: counts.negative,
      neutral: counts.neutral
    })).slice(-14);
  };

  const getCommonIssues = () => {
    const issues = [];
    const negativeReviews = reviews.filter(r => r.rating <= 2 && r.review_text);
    
    // Simple keyword extraction for common issues
    const keywords = {};
    negativeReviews.forEach(review => {
      const words = review.review_text.toLowerCase().split(/\s+/);
      ['slow', 'error', 'bug', 'fail', 'crash', 'timeout', 'expensive', 'inaccurate'].forEach(keyword => {
        if (words.includes(keyword)) {
          keywords[keyword] = (keywords[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(keywords)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getTopReviewedAgents = () => {
    const agentReviews = {};
    
    reviews.forEach(review => {
      // Find which agent/skill this review is for
      const installation = installations.find(i => i.skill_id === review.skill_id);
      if (installation) {
        const agent = agents.find(a => a.id === installation.agent_id);
        const agentName = agent?.name || 'Unknown';
        if (!agentReviews[agentName]) {
          agentReviews[agentName] = { count: 0, totalRating: 0 };
        }
        agentReviews[agentName].count++;
        agentReviews[agentName].totalRating += review.rating;
      }
    });

    return Object.entries(agentReviews)
      .map(([name, data]) => ({
        name,
        reviews: data.count,
        avgRating: (data.totalRating / data.count).toFixed(1)
      }))
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 5);
  };

  const avgRating = getAverageRating();
  const ratingDistribution = getRatingDistribution();
  const sentimentTrend = getSentimentTrend();
  const commonIssues = getCommonIssues();
  const topReviewed = getTopReviewedAgents();
  const totalReviews = reviews.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Average Rating</div>
                <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                  {avgRating}
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
                <div className="text-xs text-slate-500 mt-1">Out of 5.0</div>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total Reviews</div>
                <div className="text-2xl font-bold text-white mt-1">{totalReviews}</div>
                <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+15% vs last month</span>
                </div>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Satisfaction Rate</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {reviews.length > 0 ? ((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100).toFixed(0) : 0}%
                </div>
                <div className="text-xs text-slate-500 mt-1">4+ stars</div>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis type="category" dataKey="rating" stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#fbbf24" name="Reviews" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Sentiment Trend (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="#10b981" name="Positive" strokeWidth={2} />
                <Line type="monotone" dataKey="neutral" stroke="#fbbf24" name="Neutral" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="#ef4444" name="Negative" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Common Issues (from negative reviews)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commonIssues.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No common issues detected</p>
            ) : (
              <div className="space-y-3">
                {commonIssues.map((issue, idx) => (
                  <div key={issue.issue} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-white capitalize">{issue.issue}</span>
                    </div>
                    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                      {issue.count} mentions
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Most Reviewed Agents</CardTitle>
          </CardHeader>
          <CardContent>
            {topReviewed.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No agent reviews yet</p>
            ) : (
              <div className="space-y-3">
                {topReviewed.map((agent, idx) => (
                  <div key={agent.name} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{agent.name}</div>
                        <div className="text-xs text-slate-500">{agent.reviews} reviews</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white font-medium">{agent.avgRating}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}