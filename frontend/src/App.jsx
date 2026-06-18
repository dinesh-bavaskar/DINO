import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={4000} />
      <AppRoutes />
    </>
  );
}

export default App;
