import { useCallback, useEffect, useState } from 'react'
import { FiDownload, FiRefreshCw } from 'react-icons/fi'
import api from '../../api/client'

function QRCodePage() {
  const [data, setData] = useState(null)

  const refresh = useCallback(() => {
    api.get('/dashboard').then((response) => setData(response.data))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function regenerate() {
    await api.post('/qr/regenerate')
    refresh()
  }

  if (!data) return <main className="page-shell">Loading QR code...</main>

  return (
    <main className="page-shell">
      <p className="eyebrow">QR code</p>
      <h1>Printable menu access</h1>
      <section className="dashboard-grid">
        <article className="panel">
          <h2>{data.restaurant.name}</h2>
          {data.qrCode?.image_data_url ? <img className="qr-large" src={data.qrCode.image_data_url} alt="Restaurant menu QR code" /> : null}
          <p>{data.qrCode?.menu_url}</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={regenerate}>
              <FiRefreshCw /> Regenerate
            </button>
            {data.qrCode?.image_data_url ? (
              <a className="secondary-button" href={data.qrCode.image_data_url} download="digi-menu-qr.png">
                <FiDownload /> Download PNG
              </a>
            ) : null}
          </div>
        </article>
        <article className="panel">
          <h2>Print guidance</h2>
          <p>Use this QR code on table tents, posters, receipts, Instagram stories, and delivery packaging.</p>
          <p className="big-line">{data.qrCode?.scans || 0} scans</p>
        </article>
      </section>
    </main>
  )
}

export default QRCodePage
