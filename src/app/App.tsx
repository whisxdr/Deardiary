import { AppRouter } from './router';
import { Providers } from './providers';

/** Root component: bootstrap providers around the router. */
export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
