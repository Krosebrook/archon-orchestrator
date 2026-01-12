import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, Shield, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const categoryColors = {
  tool: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  integration: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  llm_capability: 'bg-green-500/20 text-green-400 border-green-500/30',
  data_processor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  api_connector: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  custom: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

export default function SkillCard({ skill, reviews }) {
  const skillReviews = reviews.filter(r => r.skill_id === skill.id);
  const avgRating = skill.avg_rating || 0;
  const reviewCount = skill.review_count || skillReviews.length;

  const getPriceDisplay = () => {
    if (!skill.pricing || skill.pricing.model === 'free') return 'Free';
    if (skill.pricing.model === 'one_time') return `$${(skill.pricing.amount_cents / 100).toFixed(2)}`;
    if (skill.pricing.model === 'subscription') return `$${(skill.pricing.amount_cents / 100).toFixed(2)}/mo`;
    if (skill.pricing.model === 'usage_based') return 'Usage-based';
    return 'Free';
  };

  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group">
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {skill.icon_url ? (
              <img src={skill.icon_url} alt={skill.name} className="w-10 h-10 rounded-lg" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <span className="text-lg">{skill.name[0]}</span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                {skill.name}
              </h3>
              <p className="text-xs text-slate-500">by {skill.author_name || 'Anonymous'}</p>
            </div>
          </div>
          {skill.is_verified && (
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-400 line-clamp-2">{skill.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={categoryColors[skill.category]}>
            {skill.category.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
            v{skill.version}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-medium">{avgRating.toFixed(1)}</span>
            <span className="text-slate-500">({reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Download className="w-4 h-4" />
            <span>{skill.install_count || 0}</span>
          </div>
        </div>

        {skill.tags && skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skill.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="bg-slate-950 text-slate-500 border-slate-800 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-medium text-white">
          <DollarSign className="w-4 h-4" />
          {getPriceDisplay()}
        </div>
        <Link to={createPageUrl(`SkillDetail?id=${skill.id}`)}>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}