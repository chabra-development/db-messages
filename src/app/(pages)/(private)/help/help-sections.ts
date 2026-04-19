import {
  BookUser,
  Database,
  Hash,
  Settings,
  Tag,
  UsersRound,
} from "lucide-react";

export type HelpTopic = {
  question: string;
  answer: string;
};

export type HelpSection = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
  topics: HelpTopic[];
  keywords: string[];
};

export const helpSections: HelpSection[] = [
  {
    id: "contacts",
    title: "Contatos",
    icon: BookUser,
    description: "Visualize e interaja com seus contatos e conversas.",
    keywords: [
      "contatos",
      "contato",
      "conversa",
      "conversas",
      "mensagem",
      "mensagens",
      "chat",
      "histórico",
      "lista",
      "selecionar",
      "buscar",
      "pesquisar",
      "painel",
      "visualizar",
      "abrir",
      "interagir",
    ],
    topics: [
      {
        question: "Como acessar os contatos?",
        answer:
          "Clique em 'Contatos' no menu lateral. A lista de contatos será exibida na coluna esquerda da tela.",
      },
      {
        question: "Como ver o histórico de mensagens?",
        answer:
          "Selecione um contato na lista para abrir a conversa. O histórico completo de mensagens aparecerá no painel principal à direita.",
      },
      {
        question: "O que aparece quando nenhum contato está selecionado?",
        answer:
          "Quando nenhum contato está selecionado, o painel principal exibe a mensagem 'Nenhuma conversa selecionada'. Basta clicar em um contato para iniciar.",
      },
      {
        question: "Posso filtrar ou pesquisar contatos?",
        answer:
          "Sim. Use o campo de busca disponível na lista de contatos para filtrar pelo nome ou informações do contato.",
      },
    ],
  },
  {
    id: "settings",
    title: "Configurações",
    icon: Settings,
    description: "Personalize seu perfil e a aparência do sistema.",
    keywords: [
      "configurações",
      "configuracao",
      "perfil",
      "tema",
      "temas",
      "background",
      "plano de fundo",
      "fundo",
      "aparência",
      "aparencia",
      "opções",
      "opcoes",
      "usuário",
      "usuario",
      "personalizar",
      "personalização",
      "claro",
      "escuro",
      "dark",
      "light",
      "modo",
      "nome",
      "editar",
      "alterar",
    ],
    topics: [
      {
        question: "Como alterar meu perfil?",
        answer:
          "Acesse 'Opções' no menu lateral ou clique no seu nome no rodapé do menu. O card de perfil exibe suas informações e permite edição.",
      },
      {
        question: "Como mudar o fundo (background)?",
        answer:
          "Em Configurações, localize a seção 'Escolha o background'. Selecione uma das opções disponíveis para alterar o plano de fundo do sistema.",
      },
      {
        question: "Como alternar entre tema claro e escuro?",
        answer:
          "Clique no seu nome no rodapé do menu lateral e selecione a opção de tema. Também é possível alterar em Configurações na seção 'Escolha o tema'.",
      },
    ],
  },
  {
    id: "attendants",
    title: "Atendentes",
    icon: UsersRound,
    badge: "Admin",
    description:
      "Gerencie os atendentes e membros da equipe. Disponível apenas para administradores.",
    keywords: [
      "atendentes",
      "atendente",
      "equipe",
      "time",
      "funcionários",
      "funcionario",
      "admin",
      "administrador",
      "importar",
      "importação",
      "papel",
      "role",
      "usuários",
      "usuarios",
      "membros",
      "membro",
      "paginação",
      "paginacao",
      "tabela",
      "listar",
      "cadastrar",
      "adicionar",
      "status",
      "ativo",
    ],
    topics: [
      {
        question: "Como visualizar todos os atendentes?",
        answer:
          "Acesse 'Atendentes' no menu lateral (seção Admin). A tabela exibe nome, e-mail, papel, equipes, status ativo e data de criação.",
      },
      {
        question: "Como importar novos atendentes?",
        answer:
          "Na página de Atendentes, utilize o formulário de importação disponível. Preencha as informações necessárias e confirme para adicionar o atendente ao sistema.",
      },
      {
        question: "Como navegar pela lista de atendentes?",
        answer:
          "A lista usa paginação. Utilize os controles de navegação (anterior/próximo) para percorrer as páginas. A URL reflete os parâmetros 'skip' e 'take' da paginação.",
      },
      {
        question: "Quem pode acessar esta página?",
        answer:
          "Apenas usuários com perfil de Administrador (ADMIN) têm acesso à página de Atendentes.",
      },
    ],
  },
  {
    id: "tickets",
    title: "Tickets",
    icon: Tag,
    badge: "Admin",
    description:
      "Gerencie os tickets de suporte da equipe. Disponível apenas para administradores.",
    keywords: [
      "tickets",
      "ticket",
      "suporte",
      "chamados",
      "chamado",
      "admin",
      "administrador",
      "atendimento",
      "solicitação",
      "solicitacao",
      "demanda",
      "aberto",
      "pendente",
      "registros",
      "acompanhar",
    ],
    topics: [
      {
        question: "O que são tickets?",
        answer:
          "Tickets são registros de atendimentos ou solicitações de suporte associados a contatos. Permitem organizar e acompanhar demandas em aberto.",
      },
      {
        question: "Quem pode acessar esta página?",
        answer:
          "Apenas administradores têm acesso à página de Tickets pelo menu lateral.",
      },
    ],
  },
  {
    id: "tags",
    title: "Tags",
    icon: Hash,
    badge: "Admin",
    description:
      "Crie e gerencie tags para organizar e categorizar contatos. Disponível apenas para administradores.",
    keywords: [
      "tags",
      "tag",
      "etiquetas",
      "etiqueta",
      "categorias",
      "categoria",
      "admin",
      "administrador",
      "organizar",
      "filtro",
      "classificar",
      "criar",
      "criar tag",
      "editar",
      "excluir",
      "deletar",
      "remover",
      "pesquisar",
      "buscar",
      "associar",
      "label",
      "marcador",
    ],
    topics: [
      {
        question: "Para que servem as tags?",
        answer:
          "Tags são etiquetas usadas para categorizar e organizar contatos. Facilitam a filtragem e identificação de grupos de contatos com características em comum.",
      },
      {
        question: "Como criar uma nova tag?",
        answer:
          "Na página de Tags, utilize o formulário ou botão de criação. Defina um nome para a tag e confirme. A nova tag estará disponível para ser associada a contatos.",
      },
      {
        question: "Como editar ou excluir uma tag?",
        answer:
          "Cada tag listada possui opções de editar e excluir. Clique no ícone correspondente ao lado da tag para realizar a ação desejada.",
      },
      {
        question: "Como pesquisar tags?",
        answer:
          "Utilize o campo de pesquisa na parte superior da lista de tags para filtrar por nome em tempo real.",
      },
    ],
  },
  {
    id: "supabase",
    title: "Supabase",
    icon: Database,
    badge: "Admin",
    description:
      "Monitore o banco de dados, storage e a saúde do projeto Supabase. Disponível apenas para administradores.",
    keywords: [
      "supabase",
      "banco de dados",
      "banco",
      "database",
      "storage",
      "armazenamento",
      "monitoramento",
      "monitor",
      "admin",
      "administrador",
      "tabelas",
      "tabela",
      "saúde",
      "saude",
      "projeto",
      "dashboard",
      "estatísticas",
      "estatisticas",
      "tamanho",
      "arquivos",
      "upload",
      "infraestrutura",
      "infra",
    ],
    topics: [
      {
        question: "O que é monitorado nesta página?",
        answer:
          "A página exibe três painéis: estatísticas do Projeto (saúde geral), do Banco de dados (tamanho e contagem de tabelas) e do Storage (uso de armazenamento de arquivos).",
      },
      {
        question: "Como acessar o dashboard do Supabase diretamente?",
        answer:
          "No topo da página há um link 'Abrir dashboard ↗' que abre o painel do Supabase em uma nova aba.",
      },
      {
        question: "Com que frequência os dados são atualizados?",
        answer:
          "Os dados são carregados no momento em que você acessa a página. Para ver informações atualizadas, recarregue a página.",
      },
      {
        question: "Quem pode acessar esta página?",
        answer:
          "Somente administradores têm acesso à página de monitoramento do Supabase.",
      },
    ],
  },
];
