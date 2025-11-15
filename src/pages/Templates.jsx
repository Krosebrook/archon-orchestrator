import TemplateLibrary from '../components/templates/TemplateLibrary';

export default function Templates() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Workflow Templates</h1>
        <p className="text-slate-400">Bootstrap your projects with pre-built workflows from the community.</p>
      </div>
      <TemplateLibrary />
    </div>
  );
}