import { HashRouter } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders';
import { AppRoutes } from './app/routes/AppRoutes';

export default function App() {
  return (
    <HashRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </HashRouter>
  );
}
