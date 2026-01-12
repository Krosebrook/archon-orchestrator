/**
 * @fileoverview Knowledge Base Page
 * @description Searchable documentation and troubleshooting guides
 * @version 1.0.0
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, BookOpen, ArrowLeft, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { helpArticles } from '../components/onboarding/tour-config';

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const categories = useMemo(() => {
    const cats = new Set(['all']);
    helpArticles.forEach(article => cats.add(article.category));
    return Array.from(cats);
  }, []);

  const filteredArticles = useMemo(() => {
    return helpArticles.filter(article => {
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedArticle(null)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge className="bg-blue-500/20 text-blue-400 mb-2">
                  {selectedArticle.category}
                </Badge>
                <CardTitle className="text-2xl text-white">{selectedArticle.title}</CardTitle>
                <p className="text-slate-400 text-sm mt-2">{selectedArticle.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedArticle.tags.map(tag => (
                <Badge key={tag} variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <ReactMarkdown 
                className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-white prose-p:text-slate-300
                  prose-strong:text-white prose-code:text-blue-400
                  prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
              >
                {selectedArticle.content}
              </ReactMarkdown>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-400" />
            Knowledge Base
          </h1>
          <p className="text-slate-400">Best practices, troubleshooting guides, and documentation</p>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Search articles, guides, and troubleshooting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                }
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p>No articles found matching your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map(article => (
                <Card
                  key={article.id}
                  className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardContent className="p-4">
                    <Badge className="bg-blue-500/20 text-blue-400 mb-2 text-xs">
                      {article.category}
                    </Badge>
                    <h3 className="text-white font-semibold mb-2 flex items-center justify-between">
                      {article.title}
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </h3>
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="bg-slate-900 text-slate-500 border-slate-700 text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {article.tags.length > 3 && (
                        <Badge variant="outline" className="bg-slate-900 text-slate-500 border-slate-700 text-xs">
                          +{article.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}