import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import NotFoundPage from '@/pages/NotFoundPage';
import DesignSystemPage from '@/pages/DesignSystemPage';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/applications" replace />} />
          <Route path="applications/*" element={<div />} />
          <Route path="business-capabilities/*" element={<div />} />
          <Route path="interfaces/*" element={<div />} />
          <Route path="data-objects/*" element={<div />} />
          <Route path="it-components/*" element={<div />} />
          <Route path="providers/*" element={<div />} />
          <Route path="domains/*" element={<div />} />
        </Route>

        <Route path="/login" element={<div />} />
        <Route path="/design" element={<DesignSystemPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
