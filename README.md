# NestJS + better-auth — Exemplo

Exemplo de integração do NestJS com a biblioteca `better-auth` (e o wrapper `@thallesp/nestjs-better-auth`). Este repositório mostra como configurar autenticação baseada em e-mail/senha e sessões, expor o esquema OpenAPI gerado pelo `better-auth` e proteger rotas usando o `AuthGuard` fornecido pelo wrapper.

## Visão geral

Este projeto demonstra:

- Uso de `better-auth` com adaptador Prisma (`better-auth/adapters/prisma`).
- Integração com NestJS através do pacote `@thallesp/nestjs-better-auth`.
- Geração automática de esquema OpenAPI pelo `better-auth` e mesclagem com o Swagger do Nest (`@nestjs/swagger`).
- Exposição do esquema completo gerado em `/api/auth/openapi.json` e dos paths mesclados em `/auth/api` (via `src/config/openapi.ts`).
- Proteção de rotas com `AuthGuard` e leitura de sessão via decorator `@Session()`.

Arquivos importantes:

- `src/config/auth.ts` — instancia e configura o `better-auth` (Prisma adapter, plugins, sessão, email/password).
- `src/config/openapi.ts` — pega o esquema OpenAPI gerado pelo `better-auth` e o transforma (prefix `/auth/api`) para mesclar com o Swagger do Nest.
- `src/main.ts` — configura Swagger (`/api`) e a UI de documentação (`/docs`) e expõe `/api/auth/openapi.json`.
- `src/modules/user/user.controller.ts` — exemplo de rota protegida usando `AuthGuard` e `@Session()`.
- `prisma/schema.prisma` — modelos Prisma usados pelo `better-auth` (User, Session, Account, Verification).

## Dependências principais

- NestJS (@nestjs/\*)
- better-auth
- @thallesp/nestjs-better-auth (wrapper para Nest)
- Prisma (@prisma/client + prisma CLI)

Veja `package.json` para a lista completa e scripts.

## Contrato rápido (inputs/outputs)

- Inputs: requisições HTTP para endpoints do `better-auth` (ex.: sign-up, sign-in) e para rotas da aplicação.
- Outputs: respostas JSON padrão do `better-auth` (tokens de sessão, objetos de usuário, erros HTTP).
- Erros esperados: credenciais inválidas, tokens expirados, problemas de conexão com DB.

## Casos de borda importantes

- Variáveis de ambiente ausentes (ex.: `DATABASE_URL`) → app não consegue conectar ao DB.
- Migrações Prisma não aplicadas → tabelas/tipos ausentes.
- Cookies/sessões em ambiente sem HTTPS → configurar secure cookies em produção.

## Configuração local (exemplo)

1. Instale dependências (recomendado usar `pnpm` já que o repositório contém `pnpm-lock.yaml`):

```fish
pnpm install
```

2. Defina a variável de ambiente `DATABASE_URL` apontando para um Postgres local ou remoto. Exemplo (substitua credenciais):

```fish
set -x DATABASE_URL "postgresql://username:password@localhost:5432/dbname"
```

3. Gere o cliente Prisma e aplique migrações (modo desenvolvimento):

```fish
pnpm prisma generate
pnpm prisma migrate dev
```

Se preferir rodar migrações existentes sem prompt (deploy):

```fish
pnpm prisma migrate deploy
```

4. Rode a aplicação em modo desenvolvimento:

```fish
pnpm run start:dev
```

Por padrão a aplicação escuta na porta `5000` (ver `src/main.ts`), ou `process.env.PORT` se definido.

## Documentação / OpenAPI

- A documentação Swagger do Nest está disponível em: `http://localhost:5000/api`
- A UI do `@scalar/nestjs-api-reference` (tema aplicado) está em: `http://localhost:5000/docs` — ela consome o documento mesclado.
- Os endpoints gerados pelo `better-auth` são prefixados por `/auth/api` no documento mesclado (veja `src/config/openapi.ts`).
- O esquema OpenAPI completo gerado pelo `better-auth` também é servido diretamente em: `http://localhost:5000/api/auth/openapi.json`.

Observação: `src/main.ts` tenta carregar e mesclar os paths e components gerados pelo `better-auth` no momento da inicialização. Caso a geração do esquema falhe, a aplicação ainda sobe, mas as rotas/definições do `better-auth` não aparecerão na UI até que o problema seja resolvido.

## Como o `better-auth` está configurado aqui

- Adaptador: `prismaAdapter(prisma, { provider: 'postgresql' })` — usa o cliente Prisma exportado por `src/config/auth.ts`.
- Plugins: `openAPI()` — gera o esquema OpenAPI que é mesclado com o Swagger do app.
- emailAndPassword: habilitado (`enabled: true`) e `autoSignIn: true` — após cadastro, o usuário é autenticado automaticamente.
- session.expiresIn: tempo de duração da sessão (7 dias no exemplo).
- session.cookieCache: habilitado com TTL curto (5 minutos) para cache de cookies de sessão.

Adendo sobre pluralização do adaptador Prisma

No arquivo `src/config/auth.ts` o adaptador Prisma é inicializado sem a opção `usePlural`. Há relatos/observações de que a opção `usePlural` (quando fornecida) não está sendo aplicada conforme esperado pelo adaptador — ou seja, o comportamento observado neste exemplo usa nomes de tabela singulares (por exemplo a model `User` mapeada para a tabela `user` via `@@map`) em vez de gerar/usar nomes plurais como `users`.

Por isso, este projeto define os nomes de tabela explicitamente no `prisma/schema.prisma` (veja `@@map("user")` etc.) para garantir compatibilidade com o adaptador e com a expectativa do banco de dados. Se você quiser que o adaptador use nomes plurais automaticamente, verifique a versão do `better-auth`/`prismaAdapter` e o código do adaptador, ou aplique a pluralização manualmente nas `@@map` do schema Prisma.

- Plugins: `openAPI()` — gera o esquema OpenAPI que é mesclado com o Swagger do app.
- emailAndPassword: habilitado (`enabled: true`) e `autoSignIn: true` — após cadastro, o usuário é autenticado automaticamente.
- session.expiresIn: tempo de duração da sessão (7 dias no exemplo).
- session.cookieCache: habilitado com TTL curto (5 minutos) para cache de cookies de sessão.

Os modelos Prisma necessários já estão definidos em `prisma/schema.prisma` (User, Session, Account, Verification) e possuem `@@map` configurados para nomes de tabela específicos.

## Proteger rotas no NestJS

O wrapper `@thallesp/nestjs-better-auth` fornece um `AuthGuard` e um decorador `@Session()` para acessar a sessão do usuário. Exemplo (veja `src/modules/user/user.controller.ts`):

- Uso do guard no controller:

```ts
@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  @Get('me')
  async getProfile(@Session() session: UserSession) {
    return { user: session.user };
  }
}
```

Isso garante que apenas requisições com sessão válida acessem esse endpoint.

## Segurança / Produção

- Use HTTPS em produção e marque cookies de sessão como `secure`.
- Considere configurar políticas de CORS e SameSite apropriadas.
- Em produção, gerencie `DATABASE_URL` e outros segredos com um gerenciador de segredos (Vault, AWS Secrets Manager, variáveis de ambiente do container, etc.).

## Próximos passos recomendados

- Habilitar envio de e-mails (Provider) para fluxos de verificação e reset.
- Adicionar testes automatizados cobrindo fluxo de signup/signin e proteção de rotas.
- Documentar como implementar provedores OAuth (se for necessário) usando o `Account` model.

## Recursos úteis

- better-auth: https://www.npmjs.com/package/better-auth
- nestjs-better-auth (wrapper usado): https://www.npmjs.com/package/@thallesp/nestjs-better-auth
- Prisma: https://www.prisma.io/

## Contribuições

Sinta-se livre para abrir issues ou PRs. Mantenha as mudanças pequenas e focadas (ex.: adicionar provider de e-mail, melhorar docs, adicionar testes).
