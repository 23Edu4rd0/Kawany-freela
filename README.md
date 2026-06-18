# 🤎 Anniversary Site

Site estático de aniversário de namoro — feito com HTML, CSS e JavaScript puro. Hospedado de graça na Vercel.

## Estrutura de arquivos

```
/
├── index.html          ← Estrutura e conteúdo
├── style.css           ← Visual, animações, responsividade
├── script.js           ← Contador, lightbox, typewriter, música, etc.
├── favicon.ico         ← Ícone da aba (coloque um emoji ou imagem 32×32)
├── vercel.json         ← Config opcional para URLs limpas na Vercel
└── assets/
    ├── photos/
    │   ├── og-cover.webp       ← Preview do link (WhatsApp/Telegram) — 1200×630px
    │   ├── milestone-1.webp    ← Foto da timeline — milestone 1
    │   ├── milestone-2.webp    ← Foto da timeline — milestone 2
    │   ├── milestone-3.webp    ← (adicione quantos quiser)
    │   ├── gallery-1.webp      ← Galeria de fotos
    │   ├── gallery-2.webp
    │   ├── gallery-3.webp
    │   ├── gallery-4.webp
    │   ├── gallery-5.webp
    │   └── gallery-6.webp      ← (adicione quantos quiser)
    └── music/
        └── background.mp3      ← Música de fundo (opcional, ≤3 MB)
```

---

## ✏️ Como personalizar

### 1. Dados principais (`index.html` + `script.js`)

| Placeholder | Onde fica | O que trocar |
|---|---|---|
| `[NAME_1]` | `index.html` | Seu nome |
| `[NAME_2]` | `index.html` | Nome da sua pessoa |
| `[START_DATE]` | `index.html` + `script.js` (CONFIG) | Data de início — formato `YYYY-MM-DD` |
| `[OPENING_LINE]` | `index.html` | Frase romântica de abertura |
| `[LOVE_LETTER_TEXT]` | `index.html` | Texto da carta (suporta `\n` para quebras de linha) |

Em `script.js`, procure o bloco `CONFIG` no topo do arquivo:

```js
const CONFIG = {
  startDate: '2025-06-18',   // ← coloque sua data aqui
  galleryCount: 6,           // ← número de fotos na galeria
  typewriterSpeed: 28,       // ← velocidade da máquina de escrever (ms/char)
  musicSrc: 'assets/music/background.mp3',
};
```

### 2. Timeline de marcos

Cada marco da timeline é um bloco `<article>` em `index.html`. Duplique/edite:

```html
<article class="timeline__item reveal-left" role="listitem">
  <div class="timeline__photo-wrap">
    <img
      src="assets/photos/milestone-X.webp"
      alt="Descrição da foto"
      loading="lazy"
      width="800" height="600"
    />
  </div>
  <div class="timeline__content">
    <time class="timeline__date" datetime="YYYY-MM-DD">DD/MM/YYYY</time>
    <h3 class="timeline__title">Título do marco</h3>
    <p class="timeline__caption">Descrição breve do momento.</p>
  </div>
</article>
```

> **Dica:** Itens pares use `class="timeline__item timeline__item--right reveal-right"` para alternar lados.

### 3. Galeria de fotos

Cada foto da galeria é um `<figure>` em `index.html`. Duplique o bloco e ajuste `data-index`:

```html
<figure class="gallery__item" role="listitem">
  <button class="gallery__btn" aria-label="Abrir foto X" data-index="X">
    <img
      src="assets/photos/gallery-X.webp"
      data-src="assets/photos/gallery-X.webp"
      data-caption="Legenda opcional"
      alt="Descrição da foto"
      loading="lazy"
      width="600" height="400"
    />
  </button>
</figure>
```

### 4. Cores

Todas as cores estão como variáveis CSS no topo de `style.css`:

```css
:root {
  --clr-brown:   #5C3D2E;   /* café — cor principal */
  --clr-terra:   #C0714F;   /* terracota — destaque  */
  --clr-bg:      #F7F0E6;   /* creme quente — fundo  */
  /* ... */
}
```

---

## 🖼️ Preparando as imagens

**Recomendado:** formato WebP, que é ~30% menor que JPEG com mesma qualidade.

### Converter com `ffmpeg` (terminal):
```bash
# Converter uma foto
ffmpeg -i foto.jpg -c:v libwebp -quality 82 foto.webp

# Converter um lote inteiro
for f in *.jpg; do ffmpeg -i "$f" -quality 82 "${f%.jpg}.webp"; done
```

### Converter com Squoosh (online, grátis):
→ https://squoosh.app

**Tamanhos recomendados:**
- `og-cover.webp` → 1200 × 630 px
- `milestone-*.webp` → 800 × 600 px
- `gallery-*.webp` → 600 × 400 px

---

## 🎵 Música de fundo

1. Coloque o arquivo em `assets/music/background.mp3`
2. Recomendado: instrumental suave, ~2–4 min, ≤3 MB
3. O botão de play só aparece **depois** do usuário interagir com a tela (abre a carta), respeitando a política anti-autoplay dos browsers.

Se não quiser música, deixe a pasta vazia — o botão fica escondido automaticamente quando o arquivo não carrega.

---

## 🚀 Deploy na Vercel

1. Crie conta em [vercel.com](https://vercel.com) (grátis)
2. Conecte seu repositório GitHub (ou faça upload direto)
3. Clique em **Deploy** — Vercel detecta automaticamente que é site estático
4. Seu site estará em `https://seu-projeto.vercel.app`

**URL personalizada:** na Vercel, em Settings → Domains, você pode adicionar seu próprio domínio.

---

## 🔍 Preview de link (WhatsApp / Telegram)

Para o link aparecer bonito no WhatsApp:
1. Coloque uma foto em `assets/photos/og-cover.webp` (1200×630px)
2. No `<head>` de `index.html`, preencha as tags Open Graph:
   ```html
   <meta property="og:title" content="Nome1 & Nome2 — 1 Ano Juntos 🤎" />
   <meta property="og:description" content="Sua frase romântica aqui." />
   <meta property="og:image" content="https://seu-site.vercel.app/assets/photos/og-cover.webp" />
   ```
   > Use a URL **completa** (com `https://`) na tag `og:image` — caminhos relativos não funcionam em preview de link.

---

## ♿ Acessibilidade

O site inclui por padrão:
- `alt` em todas as imagens
- ARIA labels nos botões interativos
- `aria-live` no contador (anunciado por leitores de tela)
- Lightbox via `<dialog>` nativo (foco preso automaticamente)
- Navegação por teclado (setas + Esc no lightbox)
- Suporte a `prefers-reduced-motion` (animações desativadas)
- Hierarquia de headings (`h1` → `h2` → `h3`)
