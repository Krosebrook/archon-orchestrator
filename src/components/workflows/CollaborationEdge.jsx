/**
 * @fileoverview Collaboration Edge Component
 * @description Visual indicator for agent-to-agent interactions in workflow
 * @version 1.0.0
 */

import React from 'react';
import { ArrowRight, MessageSquare, Database, Vote, Share2 } from 'lucide-react';

export default function CollaborationEdge({ 
  edge, 
  sourceNode, 
  targetNode, 
  isAnimated = false 
}) {
  const getCollaborationType = () => {
    return edge.data?.collaborationType || 'data_exchange';
  };

  const getEdgeColor = () => {
    const type = getCollaborationType();
    switch (type) {
      case 'data_exchange':
        return '#3b82f6'; // blue
      case 'peer_review':
        return '#10b981'; // green
      case 'joint_decision':
        return '#a855f7'; // purple
      case 'delegation':
        return '#f59e0b'; // amber
      default:
        return '#64748b'; // slate
    }
  };

  const getEdgeIcon = () => {
    const type = getCollaborationType();
    const iconClass = "w-4 h-4";
    
    switch (type) {
      case 'data_exchange':
        return <Database className={iconClass} />;
      case 'peer_review':
        return <MessageSquare className={iconClass} />;
      case 'joint_decision':
        return <Vote className={iconClass} />;
      case 'delegation':
        return <Share2 className={iconClass} />;
      default:
        return <ArrowRight className={iconClass} />;
    }
  };

  const getEdgeLabel = () => {
    const type = getCollaborationType();
    return edge.data?.label || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <g className="collaboration-edge">
      <defs>
        <marker
          id={`arrow-${edge.id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={getEdgeColor()} />
        </marker>
        
        {isAnimated && (
          <linearGradient id={`gradient-${edge.id}`}>
            <stop offset="0%" stopColor={getEdgeColor()} stopOpacity="0.2">
              <animate
                attributeName="offset"
                values="0;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor={getEdgeColor()} stopOpacity="0.8">
              <animate
                attributeName="offset"
                values="0;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={getEdgeColor()} stopOpacity="0.2">
              <animate
                attributeName="offset"
                values="0;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        )}
      </defs>

      <line
        x1={sourceNode?.x || 0}
        y1={sourceNode?.y || 0}
        x2={targetNode?.x || 100}
        y2={targetNode?.y || 100}
        stroke={isAnimated ? `url(#gradient-${edge.id})` : getEdgeColor()}
        strokeWidth={edge.data?.isActive ? 3 : 2}
        strokeDasharray={edge.data?.isDashed ? "5,5" : "none"}
        markerEnd={`url(#arrow-${edge.id})`}
        opacity={edge.data?.isActive ? 1 : 0.6}
      />

      <g transform={`translate(${((sourceNode?.x || 0) + (targetNode?.x || 100)) / 2}, ${((sourceNode?.y || 0) + (targetNode?.y || 100)) / 2})`}>
        <rect
          x="-40"
          y="-12"
          width="80"
          height="24"
          fill="#1e293b"
          stroke={getEdgeColor()}
          strokeWidth="1"
          rx="4"
        />
        
        <foreignObject x="-40" y="-12" width="80" height="24">
          <div className="flex items-center justify-center gap-1 h-full text-xs text-white">
            {getEdgeIcon()}
            <span>{getEdgeLabel()}</span>
          </div>
        </foreignObject>

        {edge.data?.dataCount && (
          <circle
            cx="35"
            cy="-8"
            r="8"
            fill="#ef4444"
            stroke="#1e293b"
            strokeWidth="1"
          />
        )}
        {edge.data?.dataCount && (
          <text
            x="35"
            y="-5"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {edge.data.dataCount}
          </text>
        )}
      </g>
    </g>
  );
}