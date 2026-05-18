import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./components/ThemeProvider"
import { MainLayout } from "./components/layout/MainLayout"
import { AppLayout } from "./components/layout/AppLayout"
import { Toaster } from "@/components/ui/sonner"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Insumos from "./pages/Insumos"
import Receitas from "./pages/Receitas"
import ReceitaDetalhe from "./pages/ReceitaDetalhe"
import Vendas from "./pages/Vendas"
import SkusAusentes from "./pages/SkusAusentes"
import Lojas from "./pages/Lojas"
import Dashboard from "./pages/Dashboard"
import SimulatorInsumosPage from "./pages/SimulatorInsumosPage"
import SimulatorReceitasPage from "./pages/SimulatorReceitasPage"

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>

          {/* Standalone login page (no shared layout) */}
          <Route path="/login" element={<Login />} />

          {/* Protected app pages */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/insumos" element={<Insumos />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/receitas/:id" element={<ReceitaDetalhe />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/vendas/ausentes" element={<SkusAusentes />} />
            <Route path="/lojas" element={<Lojas />} />
            <Route path="/simulator/insumos" element={<SimulatorInsumosPage />} />
            <Route path="/simulator/receitas" element={<SimulatorReceitasPage />} />
            <Route path="/simulador" element={<Navigate to="/simulator/insumos" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  )
}

export default App
