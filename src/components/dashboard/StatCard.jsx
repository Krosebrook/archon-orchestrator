
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, useSpring, useTransform } from 'framer-motion'; // Correct: import useTransform

/**
 * Helper function to extract the numeric value, any prefix/suffix,
 * and determine formatting options for Intl.NumberFormat based on the
 * original 'value' string or number.
 *
 * @param {string | number} value The input value from the prop.
 * @returns {{
 *   numericValue: number,
 *   prefix: string,
 *   suffix: string,
 *   formatterOptions: Intl.NumberFormatOptions
 * }} An object containing parsed details and formatting options.
 */
const extractAndFormatDetails = (value) => {
  let numericValue = 0;
  let prefix = '';
  let suffix = '';
  let minFractionDigits = 0;
  let maxFractionDigits = 0;
  let useGrouping = true; // Default to true for numbers (e.g., thousands separators)

  if (typeof value === 'number') {
    numericValue = value;
    // For numbers, infer decimal places or default
    if (Number.isInteger(value)) {
      minFractionDigits = 0;
      maxFractionDigits = 0;
    } else {
      const parts = value.toString().split('.');
      if (parts.length > 1) {
        maxFractionDigits = parts[1].length;
        minFractionDigits = parts[1].length;
      } else {
        // Fallback for floating numbers without explicit decimals (e.g., 123.0)
        maxFractionDigits = 2; // Default to 2 for unknown floats
        minFractionDigits = 0;
      }
    }
  } else if (typeof value === 'string') {
    // Regex to extract number, optionally with thousands separators and decimal point
    const numberMatch = value.match(/([+-]?[0-9,]+\.?\d*)/);
    if (numberMatch) {
      const numericString = numberMatch[1].replace(/,/g, ''); // Remove commas for parsing
      numericValue = parseFloat(numericString);

      prefix = value.substring(0, numberMatch.index);
      suffix = value.substring(numberMatch.index + numberMatch[1].length);

      // Determine decimal places from the original string's numeric part
      const decimalMatch = numericString.match(/\.(\d*)$/);
      if (decimalMatch) {
        minFractionDigits = decimalMatch[1].length;
        maxFractionDigits = decimalMatch[1].length;
      } else {
        // If no decimal in string, treat as integer (0 frac digits)
        minFractionDigits = 0;
        maxFractionDigits = 0;
      }
      // If the original string had commas, keep useGrouping true
      useGrouping = value.includes(',');

    } else {
      // No number found, treat whole string as prefix and numericValue as 0
      prefix = value;
      numericValue = 0;
      minFractionDigits = 0;
      maxFractionDigits = 0;
      useGrouping = false; // No grouping if not a recognized number
    }
  } else {
    // Fallback for other types of values (e.g., null, undefined)
    numericValue = 0;
    prefix = String(value); // Display original value as prefix (e.g., "null")
    minFractionDigits = 0;
    maxFractionDigits = 0;
    useGrouping = false;
  }

  // Handle potential NaN from parseFloat
  if (isNaN(numericValue)) {
    numericValue = 0;
  }

  return {
    numericValue,
    prefix,
    suffix,
    formatterOptions: {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
      useGrouping: useGrouping
    }
  };
};

export default function StatCard({ title, value, icon: Icon, change, isLoading }) {
  const isPositive = change && change.startsWith('+');
  const isNegative = change && change.startsWith('-');

  // State to hold the current parsed details (numeric value, prefix, suffix, formatting)
  // This state is updated whenever the 'value' prop changes.
  const [currentDetails, setCurrentDetails] = useState(() => extractAndFormatDetails(value));

  // Initialize useSpring with the numeric part of the initial value.
  // This will be the target for animation.
  const animatedNumericValue = useSpring(currentDetails.numericValue, {
    mass: 1,      // Controls how much resistance the spring has (heavier objects move slower)
    stiffness: 100, // Controls the spring's rigidity (higher = more rigid, faster oscillations)
    damping: 10,    // Controls how quickly the spring loses energy (higher = more dampened, less oscillation)
  });

  // Effect to update the animated value and current details when the 'value' prop changes.
  useEffect(() => {
    const newDetails = extractAndFormatDetails(value);
    animatedNumericValue.set(newDetails.numericValue); // Animate to the new numeric value
    setCurrentDetails(newDetails); // Update prefix, suffix, and formatting options for rendering
  }, [value, animatedNumericValue]); // Re-run effect if 'value' prop or 'animatedNumericValue' object changes

  // FIX: The error `animatedNumericValue.to is not a function` occurred because
  // `.to()` is a method from `react-spring`, not `framer-motion`.
  // The correct hook in `framer-motion` to transform a motion value is `useTransform`.
  const displayValue = useTransform(animatedNumericValue, (latestValue) => {
    // We format the raw number from the spring into a display-friendly string.
    // Rounding it prevents excessive decimal places during the animation.
    return new Intl.NumberFormat(undefined, currentDetails.formatterOptions).format(Math.round(latestValue));
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            {/* Skeletons for loading state */}
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold text-foreground">
              {/* Render prefix, animated number, and suffix */}
              {currentDetails.prefix}
              <motion.span>{displayValue}</motion.span> {/* motion.span correctly renders the transformed motion value */}
              {currentDetails.suffix}
            </div>
            {change && (
              <p className={`text-xs ${isPositive ? 'text-green-500 dark:text-green-400' : isNegative ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}`}>
                {change} from last month
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
