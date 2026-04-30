# ERP

Aplicacao front-end em Angular para os modulos operacionais do projeto `project-lab`.

## Visao geral

Este projeto foi construido com:

- `Angular 20`
- `TypeScript`
- `Leaflet` para mapas
- `Karma/Jasmine` para testes unitarios

## Pre-requisitos

Antes de instalar o projeto, garanta que sua maquina possui:

- `Node.js` em versao compativel com Angular 20
- `npm` instalado
- `Angular CLI` opcionalmente disponivel de forma global

Sugestao de ambiente:

- `Node.js 20 LTS` ou superior
- `npm 10` ou superior

Para validar as versoes instaladas, execute:

```bash
node -v
npm -v
```

Se quiser validar tambem o Angular CLI global:

```bash
ng version
```

## Instalacao

1. Clone o repositorio:

```bash
git clone <url-do-repositorio>
```

2. Acesse a pasta do projeto:

```bash
cd project-lab
```

3. Instale as dependencias:

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

Depois disso, a aplicacao normalmente fica disponivel em:

- `http://localhost:4200/`

Como o servidor sobe com `--host 0.0.0.0`, tambem e possivel acessar pela rede local usando o IP da maquina, por exemplo:

- `http://SEU_IP_LOCAL:4200/`

## Scripts disponiveis

### Iniciar ambiente de desenvolvimento

```bash
npm start
```

Sobe a aplicacao em modo desenvolvimento com recarregamento automatico ao alterar os arquivos.

### Build de producao

```bash
npm run build
```

Gera os arquivos compilados na pasta `dist/`.

### Build em modo watch

```bash
npm run watch
```

Mantem a compilacao ativa em modo desenvolvimento, recompilando a cada alteracao.

### Rodar testes unitarios

```bash
npm test
```

Executa os testes configurados com `Karma/Jasmine`.

## Estrutura basica do projeto

Os principais diretorios sao:

- `src/app`: componentes, paginas, rotas e logica da aplicacao
- `src/assets`: arquivos estaticos e mockups
- `src/styles.scss`: estilos globais
- `angular.json`: configuracoes de build e serve

## Observacoes importantes

- O projeto utiliza `Leaflet`, e os estilos/imagens necessarios ja estao configurados no `angular.json`.
- O servidor de desenvolvimento pode falhar se a porta `4200` estiver ocupada.
- Se a porta estiver em uso, voce pode iniciar em outra porta com:

```bash
ng serve --host 0.0.0.0 --port 4300
```

## Solucao de problemas

### Falha ao instalar dependencias

Remova `node_modules` e o cache local do npm, depois reinstale:

```bash
rm -rf node_modules package-lock.json
npm install
```

No Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Aplicacao nao abre no navegador

Verifique:

- se o `npm install` foi concluido sem erros
- se o servidor foi iniciado com `npm start`
- se a porta `4200` nao esta ocupada por outro processo

### Problemas com cache do navegador

Se alguma alteracao visual ou de assets nao aparecer, faca um reload forcado:

```text
Ctrl + F5
```

## Comandos uteis do Angular CLI

Gerar um componente:

```bash
ng generate component nome-do-componente
```

Listar opcoes do Angular CLI:

```bash
ng generate --help
```

## Licenca

Definir conforme a politica do projeto.
