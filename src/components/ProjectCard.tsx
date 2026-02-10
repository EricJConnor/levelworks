import React from 'react';

interface ProjectCardProps {
  id: string;
  clientName: string;
  projectType: string;
  status: 'draft' | 'sent' | 'approved' | 'in-progress' | 'completed';
  estimateTotal: number;
  lastUpdated: string;
  imageUrl: string;
  onClick: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  clientName,
  projectType,
  status,
  estimateTotal,
  lastUpdated,
  imageUrl,
  onClick
}) => {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    'in-progress': 'bg-orange-100 text-orange-700',
    completed: 'bg-purple-100 text-purple-700'
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
    >
      <img src={imageUrl} alt={projectType} className="w-full h-48 object-cover" />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-900">{clientName}</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
            {status}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-3">{projectType}</p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-blue-600">${estimateTotal.toLocaleString()}</span>
          <span className="text-xs text-gray-500">{lastUpdated}</span>
        </div>
      </div>
    </div>
  );
};
