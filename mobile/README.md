# App Android (Capacitor)

O app é uma casca nativa que abre **https://certified-series.vercel.app** em tela cheia.
Tudo o que muda no site chega ao app na hora, sem nova versão na Play Store.
Só mudanças nesta pasta (plugins, ícone, manifesto, SDK) pedem um build novo.

- **ID do app:** `com.certifiedseries.app` (não pode mudar depois da primeira publicação)
- **Android:** mínimo 7.0 (API 24), `targetSdk` 36
- **Plugins:** App (botão voltar), Share + Filesystem (compartilhar o card como imagem),
  SystemBars (edge-to-edge e cor dos ícones da barra de status), `@capacitor-community/admob`,
  PushNotifications (avisos de episódio novo, via Firebase Cloud Messaging)

O que o site faz dentro do app fica em `src/lib/native.ts` e `src/components/NativeAppBridge.tsx`
(e `src/lib/admob.ts` para anúncios). Fora do app, tudo isso é ignorado.

## Build

O GitHub Actions (`.github/workflows/android.yml`) compila a cada PR que mexe em `mobile/`
e deixa os arquivos na aba **Actions → Android app → Artifacts**:

- `certified-series-apk-teste`: APK de debug para instalar direto no celular
- `certified-series-play-aab`: pacote para a Play Console, só quando a chave de upload estiver configurada

Localmente (precisa do Android Studio / SDK):

```bash
cd mobile
npm ci
npx cap sync android
npx cap open android          # ou: cd android && ./gradlew assembleDebug
```

## Configuração para publicar

No GitHub, em **Settings → Secrets and variables → Actions**:

| Nome | Tipo | O que é |
| --- | --- | --- |
| `ADMOB_APP_ID` | variável | ID do app no AdMob (`ca-app-pub-…~…`). Sem ele, o app usa o ID de teste do Google |
| `ANDROID_KEYSTORE_BASE64` | segredo | Chave de upload (`.jks`) em base64 |
| `ANDROID_KEYSTORE_PASSWORD` | segredo | Senha do keystore |
| `ANDROID_KEY_ALIAS` | segredo | Alias da chave |
| `ANDROID_KEY_PASSWORD` | segredo | Senha da chave |
| `GOOGLE_SERVICES_JSON` | segredo | Conteúdo do `google-services.json` do Firebase (notificações push). Sem ele, o app funciona sem push |

Criar a chave de upload (uma vez; guarde o arquivo e as senhas, sem eles não dá para atualizar o app):

```bash
keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 upload.jks          # valor de ANDROID_KEYSTORE_BASE64
```

O `versionCode` de cada build é o número da execução do workflow, então cada AAB enviado à Play Console é maior que o anterior.

## Notificações push (Firebase)

1. Em [console.firebase.google.com](https://console.firebase.google.com), crie um projeto e adicione um app Android com o pacote `com.certifiedseries.app`.
2. Baixe o `google-services.json` e cole o conteúdo inteiro no segredo `GOOGLE_SERVICES_JSON` do GitHub. Gere um build novo do app.
3. Em **Configurações do projeto → Contas de serviço → Gerar nova chave privada**, baixe o JSON da conta de serviço
   e cole o conteúdo na variável `FIREBASE_SERVICE_ACCOUNT` do projeto na Vercel. É com ela que o site envia os avisos.

O site só pede permissão de notificação no app quando `FIREBASE_SERVICE_ACCOUNT` está configurada.
A checagem de episódios roda uma vez por dia (Vercel Cron, `vercel.json`) e precisa da variável `CRON_SECRET` na Vercel.
