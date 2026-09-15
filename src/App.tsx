import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { SearchResults } from '@/pages/SearchResults';
import { PartDetail } from '@/pages/PartDetail';
import { Dashboard } from '@/pages/Dashboard';
import { Inventory } from '@/pages/Inventory';
import { Parts } from '@/pages/Parts';
import { Suppliers } from '@/pages/Suppliers';
import { Rfqs } from '@/pages/Rfqs';
import { Quotes } from '@/pages/Quotes';
import { Orders } from '@/pages/Orders';
import { History } from '@/pages/History';
import { SupplierPortal } from '@/pages/SupplierPortal';
import { Settings } from '@/pages/Settings';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/part/:id" element={<PartDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/parts" element={<Parts />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/rfqs" element={<Rfqs />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/history" element={<History />} />
        <Route path="/supplier-portal" element={<SupplierPortal />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
