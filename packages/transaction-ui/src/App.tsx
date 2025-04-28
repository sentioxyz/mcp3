import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Providers } from '@/components/Providers'
import { TransactionRoute } from '@/routes/TransactionRoute'
import { HomeRoute } from '@/routes/HomeRoute'

function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/sui/tx/:txId" element={<TransactionRoute />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}

export default App
