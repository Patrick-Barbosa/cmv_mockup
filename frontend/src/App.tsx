import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ThemeProvider"
import { MainLayout } from "./components/layout/MainLayout"
import { AppLayout } from "./components/layout/AppLayout"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Insumos from "./pages/Insumos"
import Receitas from "./pages/Receitas"
import ReceitaDetalhe from "./pages/ReceitaDetalhe"
import Vendas from "./pages/Vendas"
import Lojas from "./pages/Lojas"

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
            <Route path="/insumos" element={<Insumos />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/receitas/:id" element={<ReceitaDetalhe />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/lojas" element={<Lojas />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App


