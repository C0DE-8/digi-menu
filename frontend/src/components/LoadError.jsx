export default function LoadError({ message = 'We couldn’t load this page. Please try again.' }) {
  return <main className="page-shell"><section className="panel" role="alert"><h1>Let’s try that again.</h1><p>{message}</p><button className="primary-button" onClick={() => window.location.reload()}>Try again</button></section></main>
}
