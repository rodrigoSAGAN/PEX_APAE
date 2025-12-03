import React from "react";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-100 border-t border-slate-700">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-wrap justify-between gap-10">

        <div className="w-fit space-y-3">
          <h3 className="text-xl font-bold tracking-tight">APAE – Pinhão</h3>
          <p className="text-sm text-slate-300 leading-relaxed max-w-[200px]">
            Instituição dedicada à educação especial, apoio às famílias e inclusão social.
          </p>
          <p className="text-xs text-slate-400 max-w-[200px]">© {new Date().getFullYear()} APAE – Pinhão. Todos os direitos reservados.</p>
        </div>

        <div className="w-fit">
          <h4 className="text-lg font-semibold mb-3">Contato</h4>

          <div className="flex items-start gap-3 text-sm mb-3">
            <div className="text-emerald-400 shrink-0" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-6-4.35-6-10a6 6 0 0112 0c0 5.65-6 10-6 10z" />
                <circle cx="12" cy="11" r="2.5" />
              </svg>
            </div>
            <a
              href="https://www.google.com/maps?q=APAE+Pinh%C3%A3o+PR"
              target="_blank"
              rel="noreferrer"
              aria-label="Ver endereço da APAE Pinhão no Google Maps"
              className="hover:underline text-slate-300"
            >
              Rua XV de Novembro, 30<br />
              Pinhão – PR, CEP 85170-000
            </a>
          </div>

          <div className="flex items-start gap-3 text-sm">
            <div className="text-emerald-400 shrink-0" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.9v3a2 2 0 01-2.2 2 19.7 19.7 0 01-8.6-3 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7A12.8 12.8 0 019.8 6a2 2 0 01-.4 2.1l-1 1a16 16 0 006 6l1-1a2 2 0 012.1-.4 12.8 12.8 0 012.8.7A2 2 0 0122 16.9z" />
              </svg>
            </div>
            <div className="text-slate-300 space-y-1">
              <p>(42) 9 9828-3685</p>
              <p>(42) 9 9966-2008</p>
              <p>(42) 3677-1653</p>
              <p>(42) 3677-3792</p>
            </div>
          </div>
        </div>

        <div className="w-fit">
          <h4 className="text-lg font-semibold mb-3">Redes sociais</h4>

          <div className="space-y-2 text-sm">

            <a
              href="https://www.facebook.com/p/APAE-Pinh%C3%A3o-100057227448645/"
              className="flex items-center gap-2 hover:text-emerald-400 transition"
              target="_blank"
              rel="noreferrer"
              aria-label="Visite nossa página no Facebook"
            >
              <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="#1877f2" aria-hidden="true">
                <path d="M22 12.07C22 6.52 17.52 2 12 2S2 6.52 2 12.07C2 17.1 5.66 21.25 10.44 22v-6.99H8.08v-2.94h2.36v-2.24c0-2.33 
                1.38-3.62 3.5-3.62.99 0 2.02.18 2.02.18v2.23H14.9c-1.3 0-1.7.81-1.7 
                1.64v1.81h2.89l-.46 2.94H13.2V22C17.98 21.25 22 17.1 22 12.07z"/>
              </svg>
              Facebook
            </a>

            <a
              href="https://www.instagram.com/apae_pinhaopr/?hl=en"
              className="flex items-center gap-2 hover:text-rose-400 transition"
              target="_blank"
              rel="noreferrer"
              aria-label="Visite nosso perfil no Instagram"
            >
              <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <path d="M17.5 6.5h.01" />
              </svg>
              Instagram
            </a>
          </div>
        </div>

        <div className="w-fit">
          <h4 className="text-lg font-semibold mb-3">Links úteis</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <a href="/" className="hover:text-emerald-400 transition">Início</a>
            </li>
            <li>
              <a href="/products" className="hover:text-emerald-400 transition">Lojinha Solidária</a>
            </li>
            <li>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Voltar ao topo da página"
                className="hover:text-emerald-400 transition"
              >
                Voltar ao topo
              </button>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
}
