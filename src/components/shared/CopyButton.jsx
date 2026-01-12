import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Copy to clipboard button with success feedback.
 * 
 * @example
 * <CopyButton value="trace_abc123" />
 * <CopyButton value={JSON.stringify(data)} label="Copy JSON" />
 */
export function CopyButton({ 
  value, 
  label, 
  variant = 'ghost',
  size = 'icon',
  className = '',
  showToast = true
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (showToast) {
        toast.success('Copied to clipboard');
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy');
    }
  };

  if (label) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleCopy}
        className={className}
      >
        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
        {label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}