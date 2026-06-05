import { Loader2 } from 'lucide-react';

const Loader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center gap-3 p-16">
    <Loader2 className="animate-spin text-sky-500" size={36} />
    <p className="text-sm font-medium text-slate-500">{text}</p>
  </div>
);

export default Loader;
