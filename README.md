# Sistema Web APAE – Pinhão

Sistema web desenvolvido para a APAE – Pinhão com o objetivo de apoiar a gestão da loja solidária, organização de eventos e atividades administrativas da instituição.

## Introdução

O Sistema Web APAE – Pinhão é uma plataforma desenvolvida para apoiar as atividades da APAE do município de Pinhão – PR. O sistema tem como objetivo digitalizar e organizar processos internos da instituição, facilitando a gestão da loja solidária, a divulgação de eventos e o controle administrativo das atividades realizadas.

A plataforma permite que a comunidade visualize produtos disponíveis para venda, acompanhe eventos promovidos pela instituição e interaja com a loja solidária. Além disso, o sistema possui uma área administrativa destinada à gestão de produtos, pedidos e eventos, auxiliando na organização das atividades da APAE.

O projeto foi desenvolvido como parte de uma atividade acadêmica e busca contribuir com a modernização dos processos da instituição por meio de uma solução digital simples, acessível e eficiente.

---

## Tecnologias Utilizadas

O sistema foi desenvolvido utilizando tecnologias modernas de desenvolvimento web.

- **Next.js** – Framework utilizado para construção da aplicação web  
- **React** – Biblioteca para criação da interface de usuário  
- **Firebase** – Plataforma utilizada para serviços de backend  
- **Firestore** – Banco de dados NoSQL utilizado para armazenamento das informações  
- **Tailwind CSS** – Framework de estilização da interface  
- **Node.js** – Ambiente de execução JavaScript  
- **NPM** – Gerenciador de pacotes utilizado no projeto  
- **Git e GitHub** – Controle de versão do projeto  

---

## Funcionalidades do Sistema

O sistema possui diversos recursos voltados para apoiar as atividades da instituição.

### Loja Solidária
- Visualização de produtos disponíveis
- Exibição de produtos em formato de cards com imagem, nome e preço
- Filtros por categorias
- Adição de produtos ao carrinho
- Atualização automática do valor total da compra

### Carrinho de Compras
- Visualização dos produtos adicionados ao carrinho
- Alteração de quantidades de produtos
- Cálculo automático do valor total
- Opção para continuar comprando

### Módulo de Eventos
- Visualização de eventos cadastrados
- Exibição de informações como descrição, data e imagem
- Possibilidade de reserva para participação em eventos

### Painel Administrativo
- Login administrativo
- Gerenciamento de produtos
- Gerenciamento de pedidos
- Gerenciamento de eventos
- Visualização de relatórios de vendas
- Registro de logs administrativos

---

## Arquitetura do Sistema

O sistema foi desenvolvido utilizando uma arquitetura baseada em **cliente-servidor**, com separação entre frontend e backend.

A interface da aplicação foi construída utilizando **Next.js**, enquanto os serviços de backend são fornecidos pela plataforma **Firebase**, utilizando o banco de dados **Firestore** para armazenamento das informações.

Essa arquitetura permite maior organização do código, facilidade de manutenção e possibilidade de expansão futura da aplicação.

---

## Instalação do Projeto

Para executar o projeto localmente é necessário possuir algumas ferramentas instaladas no computador.

### Requisitos

Certifique-se de possuir os seguintes softwares instalados:

- Node.js (versão 18 ou superior)
- NPM (gerenciador de pacotes do Node)
- Git
- Navegador web atualizado

Para verificar se o Node está instalado, execute no terminal:

```bash
node -v
```

Para verificar o NPM:

```bash
npm -v
```

---

## Clonando o Repositório

Clone o projeto utilizando o Git:

```bash
git clone https://github.com/rodrigoSAGAN/PEX_APAE
```

Acesse a pasta do projeto:

```bash
cd PEX_APAE
```

---

## Estrutura do Projeto

O projeto está organizado em duas partes principais:

```
PEX_APAE
│
├── frontend
├── backend
└── README.md
```

- **frontend** → aplicação web desenvolvida em Next.js  
- **backend** → serviços e integração com Firebase  

---

## Instalação das Dependências

### Instalar dependências do Frontend

```bash
cd frontend
npm install
```

### Instalar dependências do Backend

Abra outro terminal ou volte para a raiz do projeto:

```bash
cd ..
cd backend
npm install
```

---

## Configuração do Firebase

O projeto utiliza o Firebase como backend e banco de dados através do Firestore.

Para executar o projeto corretamente é necessário possuir um projeto configurado no Firebase.

Passos básicos:

- Acessar o Firebase Console  
- Criar um novo projeto  
- Ativar o serviço **Firestore Database**  
- Copiar as credenciais do projeto  

Após isso, crie um arquivo chamado `.env.local` e adicione as variáveis do Firebase.

Exemplo:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Executando o Projeto

### Rodar o Backend

```bash
cd backend
npm run dev
```

### Rodar o Frontend

Abra outro terminal e execute:

```bash
cd frontend
npm run dev
```

Após iniciar o frontend, a aplicação estará disponível no navegador no endereço:

```
http://localhost:3000
```

---

## Build para Produção

Para gerar a versão de produção do sistema utilize:

```bash
npm run build
```

Para executar a versão otimizada para produção:

```bash
npm start
```

---

## Deploy

O sistema utiliza Firebase para serviços de backend e armazenamento de dados.

O deploy da aplicação pode ser realizado utilizando a plataforma **Vercel**, que possui integração direta com projetos desenvolvidos em **Next.js**, permitindo a publicação automática do sistema a partir do repositório GitHub.

---

## Repositório do Projeto

O código fonte do projeto está disponível no GitHub:

```
https://github.com/rodrigoSAGAN/PEX_APAE
```

---

## Desenvolvedores

Projeto desenvolvido por:

Bruno Henrique da Silva Ribeiro  
Marcos Henrique Taques  
Rodrigo Sagan Batista de Souza  

---

## Agradecimentos

Agradecemos à **APAE – Pinhão** pela oportunidade de desenvolver este projeto e contribuir com a digitalização de seus processos internos.

Também agradecemos à **Faculdade Campo Real – Guarapuava** e aos professores envolvidos no acompanhamento e orientação do projeto acadêmico.

---

## Licença

Este projeto foi desenvolvido para fins acadêmicos como parte de uma atividade da Faculdade Campo Real. O uso do código é destinado exclusivamente para fins educacionais.
