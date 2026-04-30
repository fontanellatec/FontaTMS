# ERP - Fonta TMS

Aplicação front-end em Angular para os módulos operacionais do projeto.

## Visão geral

Este projeto foi construído com:

- `Angular 20`
- `TypeScript`
- `Leaflet` para mapas
- `Karma/Jasmine` para testes unitários

## Pré-requisitos

Antes de instalar o projeto, garanta que sua máquina possui:

- `Node.js` em versão compatível com Angular 20
- `npm` instalado
- `Angular CLI`(opcionalmente disponível de forma global)

Sugestão de ambiente:

- `Node.js 20 LTS` ou superior
- `npm 10` ou superior

Para validar as versões instaladas, execute:

```bash
node -v
npm -v
```

Se quiser validar também o Angular CLI global:

```bash
ng version
```

## Instalação

1. Clone o repositório:

```bash
git clone <url-do-repositório>
```

2. Acesse a pasta do projeto:

```bash
cd fonta-tms
```

3. Instale as dependências:

```bash
npm install
```

## Como executar em ambiente local

Para iniciar o servidor de desenvolvimento, execute:

```bash
npm start
```

Esse comando executa:

```bash
ng serve --host 0.0.0.0
```

Depois disso, a aplicação normalmente fica disponível em:

- `http://localhost:4200/`

Como o servidor sobe com `--host 0.0.0.0`, também é possível acessar pela rede local usando o IP da máquina, por exemplo:

- `http://SEU_IP_LOCAL:4200/`

## Scripts disponíveis

### Iniciar ambiente de desenvolvimento

```bash
npm start
```

Sobe a aplicação em modo desenvolvimento com recarregamento automático ao alterar os arquivos.

### Build de produção

```bash
npm run build
```

Gera os arquivos compilados na pasta `dist/`.

### Build em modo watch

```bash
npm run watch
```

Mantém a compilação ativa em modo desenvolvimento, recompilando a cada alteração.

### Rodar testes unitários

```bash
npm test
```

Executa os testes configurados com `Karma/Jasmine`.

## Estrutura básica do projeto

Os principais diretórios são:

- `src/app`: componentes, páginas, rotas e lógica da aplicação
- `src/assets`: arquivos estáticos e mockups
- `src/styles.scss`: estilos globais
- `angular.json`: configurações de build e serve

## Observações importantes

- O projeto utiliza `Leaflet`, e os estilos/imagens necessários já estão configurados no `angular.json`.
- O servidor de desenvolvimento pode falhar se a porta `4200` estiver ocupada.
- Se a porta estiver em uso, você pode iniciar em outra porta com:

```bash
ng serve --host 0.0.0.0 --port 4300
```

## Solução de problemas

### Falha ao instalar dependências

Remova `node_modules` e o cache local do npm, depois reinstale:

**Windows (PowerShell):**

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

**Linux/Mac:**

```bash
rm -rf node_modules package-lock.json
npm install
```

### Aplicação não abre no navegador

Verifique:

- se o `npm install` foi concluído sem erros
- se o servidor foi iniciado com `npm start`
- se a porta `4200` não está ocupada por outro processo

### Problemas com cache do navegador

Se alguma alteração visual ou de assets não aparecer, faça um reload forçado:

- `Ctrl + F5` (Windows/Linux)
- `Cmd + Shift + R` (Mac)

## Comandos úteis do Angular CLI

Gerar um componente:

```bash
ng generate component nome-do-componente
```

Gerar um serviço:

```bash
ng generate service nome-do-servico
```

Listar opções do Angular CLI:

```bash
ng generate --help
```

## Licença

Definir conforme a política do projeto.
