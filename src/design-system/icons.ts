import { normalizeText } from '@/utils/format';

/**
 * CATÁLOGO DE ÍCONES (Material Symbols Outlined).
 * Fonte única dos ícones escolhíveis em categorias e metas. Cada item tem o nome da ligadura do
 * Material Symbols, um rótulo em português (usado como `aria-label`) e palavras-chave de busca.
 * Ao adicionar um ícone, use apenas nomes existentes em https://fonts.google.com/icons.
 */
export interface IconOption {
  name: string;
  label: string;
  keywords: readonly string[];
}

const icon = (name: string, label: string, keywords: string): IconOption => ({
  name,
  label,
  keywords: keywords.split(' '),
});

export const ICON_CATALOG: readonly IconOption[] = [
  // Alimentação
  icon('restaurant', 'Restaurante', 'alimentacao comida refeicao almoco jantar'),
  icon('shopping_cart', 'Carrinho de compras', 'mercado supermercado compras alimentacao'),
  icon('local_grocery_store', 'Mercearia', 'mercado supermercado feira alimentacao'),
  icon('local_cafe', 'Café', 'cafeteria lanche padaria bebida'),
  icon('bakery_dining', 'Padaria', 'pao lanche cafe alimentacao'),
  icon('local_pizza', 'Pizza', 'delivery comida lanche'),
  icon('fastfood', 'Lanche rápido', 'hamburguer fast food delivery comida'),
  icon('lunch_dining', 'Hambúrguer', 'lanche almoco comida'),
  icon('ramen_dining', 'Comida oriental', 'japones restaurante comida'),
  icon('set_meal', 'Prato feito', 'refeicao almoco restaurante'),
  icon('icecream', 'Sorvete', 'doce sobremesa lazer'),
  icon('local_bar', 'Bar', 'bebida drinks happy hour'),
  icon('wine_bar', 'Vinho', 'bebida adega bar'),
  // Casa e contas
  icon('home', 'Casa', 'moradia lar aluguel residencia'),
  icon('apartment', 'Apartamento', 'moradia condominio aluguel predio'),
  icon('cottage', 'Chalé', 'casa campo moradia'),
  icon('bed', 'Cama', 'quarto moveis casa hospedagem'),
  icon('chair', 'Móveis', 'cadeira decoracao casa'),
  icon('kitchen', 'Cozinha', 'geladeira eletrodomestico casa'),
  icon('cleaning_services', 'Limpeza', 'faxina diarista produtos casa'),
  icon('local_laundry_service', 'Lavanderia', 'roupa lavar casa'),
  icon('plumbing', 'Encanamento', 'reparo manutencao casa'),
  icon('construction', 'Obra', 'reforma construcao manutencao'),
  icon('handyman', 'Reparos', 'manutencao ferramentas conserto'),
  icon('format_paint', 'Pintura', 'reforma decoracao casa'),
  icon('yard', 'Jardim', 'plantas quintal casa'),
  icon('lightbulb', 'Lâmpada', 'luz energia ideia'),
  icon('bolt', 'Energia', 'luz eletricidade conta'),
  icon('water_drop', 'Água', 'conta saneamento agua'),
  icon('local_fire_department', 'Gás', 'fogo botijao conta'),
  icon('wifi', 'Internet', 'wifi conexao conta'),
  icon('router', 'Roteador', 'internet rede conta'),
  icon('tv', 'TV', 'televisao streaming assinatura'),
  icon('receipt_long', 'Recibo', 'conta boleto nota fiscal'),
  icon('request_quote', 'Orçamento', 'conta boleto cobranca'),
  icon('calendar_month', 'Mensalidade', 'calendario recorrente agenda'),
  icon('subscriptions', 'Assinaturas', 'streaming servicos mensalidade'),
  // Assinaturas e serviços digitais
  icon('live_tv', 'Streaming de vídeo', 'netflix filmes series tv assinatura'),
  icon('play_circle', 'Vídeos', 'youtube video streaming assinatura'),
  icon('library_music', 'Streaming de música', 'spotify deezer musica playlist assinatura'),
  icon('podcasts', 'Podcasts', 'audio programa assinatura'),
  icon('cloud', 'Nuvem', 'icloud google drive armazenamento backup assinatura'),
  icon('smart_toy', 'Inteligência artificial', 'ia ai claude chatgpt robo assinatura'),
  icon('auto_awesome', 'IA criativa', 'ia ai inteligencia artificial assinatura'),
  icon('local_shipping', 'Entregas', 'amazon prime frete delivery assinatura'),
  icon('newspaper', 'Notícias', 'jornal revista leitura assinatura'),
  icon('apps', 'Aplicativos', 'apps software programa assinatura'),
  icon('vpn_key', 'Senhas e VPN', 'seguranca chave senha vpn assinatura'),
  // Transporte
  icon('directions_car', 'Carro', 'transporte automovel veiculo'),
  icon('commute', 'Deslocamento', 'transporte trajeto trabalho'),
  icon('local_gas_station', 'Combustível', 'gasolina posto etanol transporte'),
  icon('ev_station', 'Recarga elétrica', 'carro eletrico energia transporte'),
  icon('car_repair', 'Oficina', 'mecanico manutencao carro'),
  icon('local_parking', 'Estacionamento', 'parking carro transporte'),
  icon('local_taxi', 'Táxi', 'aplicativo corrida uber transporte'),
  icon('directions_bus', 'Ônibus', 'transporte publico passagem'),
  icon('subway', 'Metrô', 'transporte publico passagem'),
  icon('train', 'Trem', 'transporte publico passagem'),
  icon('two_wheeler', 'Moto', 'motocicleta transporte'),
  icon('pedal_bike', 'Bicicleta', 'bike transporte esporte'),
  // Viagens
  icon('flight', 'Avião', 'viagem voo passagem aerea'),
  icon('flight_takeoff', 'Decolagem', 'viagem ferias voo'),
  icon('luggage', 'Bagagem', 'mala viagem ferias'),
  icon('hotel', 'Hotel', 'hospedagem viagem'),
  icon('beach_access', 'Praia', 'ferias viagem verao lazer'),
  icon('map', 'Mapa', 'viagem turismo passeio'),
  icon('travel_explore', 'Explorar', 'viagem turismo mundo'),
  icon('sailing', 'Barco', 'viagem passeio nautico'),
  icon('hiking', 'Trilha', 'caminhada natureza aventura'),
  // Saúde
  icon('health_and_safety', 'Saúde', 'plano de saude seguro cuidado'),
  icon('medical_services', 'Serviços médicos', 'medico saude consulta'),
  icon('local_hospital', 'Hospital', 'saude emergencia'),
  icon('local_pharmacy', 'Farmácia', 'remedio drogaria saude'),
  icon('medication', 'Remédios', 'medicamento farmacia saude'),
  icon('vaccines', 'Vacinas', 'saude prevencao'),
  icon('dentistry', 'Dentista', 'odontologia dente saude'),
  icon('psychology', 'Terapia', 'psicologo saude mental'),
  icon('monitor_heart', 'Exames', 'coracao saude check-up'),
  // Esportes e bem-estar
  icon('fitness_center', 'Academia', 'esporte musculacao treino'),
  icon('sports_soccer', 'Futebol', 'esporte bola'),
  icon('sports_basketball', 'Basquete', 'esporte bola'),
  icon('sports_tennis', 'Tênis', 'esporte raquete'),
  icon('pool', 'Natação', 'piscina esporte'),
  icon('directions_run', 'Corrida', 'esporte exercicio'),
  icon('self_improvement', 'Meditação', 'yoga bem-estar'),
  icon('spa', 'Spa', 'beleza bem-estar relaxar'),
  icon('content_cut', 'Cabeleireiro', 'beleza salao corte barbearia'),
  icon('face_retouching_natural', 'Estética', 'beleza cosmeticos maquiagem'),
  // Lazer
  icon('sports_esports', 'Games', 'jogos videogame lazer'),
  icon('theater_comedy', 'Teatro', 'cultura espetaculo lazer'),
  icon('movie', 'Cinema', 'filme lazer'),
  icon('music_note', 'Música', 'show streaming lazer'),
  icon('celebration', 'Festa', 'comemoracao aniversario lazer'),
  icon('festival', 'Evento', 'festival show lazer'),
  icon('nightlife', 'Balada', 'noite festa lazer'),
  icon('attractions', 'Parque de diversões', 'passeio lazer'),
  icon('park', 'Parque', 'passeio natureza lazer'),
  icon('casino', 'Apostas', 'jogos sorte loteria'),
  // Educação e trabalho
  icon('school', 'Educação', 'escola faculdade curso estudo'),
  icon('menu_book', 'Livros', 'leitura estudo educacao'),
  icon('auto_stories', 'Leitura', 'livro estudo'),
  icon('science', 'Ciência', 'curso pesquisa estudo'),
  icon('work', 'Trabalho', 'emprego salario profissional'),
  icon('business_center', 'Negócios', 'empresa trabalho maleta'),
  icon('badge', 'Crachá', 'emprego trabalho beneficio'),
  icon('engineering', 'Serviços', 'profissional prestador trabalho'),
  icon('storefront', 'Loja', 'comercio vendas negocio'),
  // Tecnologia
  icon('laptop_mac', 'Notebook', 'computador tecnologia trabalho'),
  icon('computer', 'Computador', 'pc tecnologia'),
  icon('devices', 'Eletrônicos', 'aparelhos tecnologia'),
  icon('phone_iphone', 'Celular', 'telefone smartphone conta'),
  icon('smartphone', 'Smartphone', 'celular telefone tecnologia'),
  icon('headphones', 'Fones', 'audio musica tecnologia'),
  icon('photo_camera', 'Câmera', 'foto fotografia tecnologia'),
  icon('watch', 'Relógio', 'acessorio tecnologia'),
  icon('print', 'Impressora', 'escritorio tecnologia'),
  // Compras e presentes
  icon('shopping_bag', 'Compras', 'sacola loja roupas'),
  icon('local_mall', 'Shopping', 'compras loja'),
  icon('checkroom', 'Roupas', 'vestuario moda compras'),
  icon('sell', 'Vendas', 'etiqueta preco promocao'),
  icon('card_giftcard', 'Presente', 'presentes aniversario natal'),
  icon('redeem', 'Brinde', 'presente vale cupom'),
  icon('cake', 'Aniversário', 'bolo festa presente'),
  icon('volunteer_activism', 'Doações', 'caridade ajuda dizimo'),
  icon('church', 'Igreja', 'dizimo religiao doacao'),
  // Família, crianças e pets
  icon('child_care', 'Crianças', 'filhos bebe escola infantil'),
  icon('child_friendly', 'Carrinho de bebê', 'bebe filhos criancas'),
  icon('toys', 'Brinquedos', 'criancas presente filhos'),
  icon('family_restroom', 'Família', 'filhos casa criancas'),
  icon('pets', 'Pets', 'cachorro gato animal veterinario racao'),
  // Dinheiro e investimentos
  icon('account_balance_wallet', 'Carteira', 'dinheiro salario receita'),
  icon('payments', 'Pagamentos', 'dinheiro receita freelance'),
  icon('attach_money', 'Dinheiro', 'receita renda cifrao'),
  icon('paid', 'Pago', 'dinheiro receita moeda'),
  icon('savings', 'Poupança', 'cofrinho reserva investimento economia'),
  icon('account_balance', 'Banco', 'conta bancaria instituicao financeira'),
  icon('credit_card', 'Cartão de crédito', 'fatura cartao pagamento'),
  icon('trending_up', 'Investimentos', 'rendimentos crescimento bolsa acoes'),
  icon('show_chart', 'Gráfico', 'investimentos bolsa acoes'),
  icon('monitoring', 'Monitoramento', 'investimentos grafico desempenho'),
  icon('currency_exchange', 'Câmbio', 'moeda dolar troca'),
  icon('diamond', 'Joias', 'luxo valor investimento'),
  icon('shield', 'Proteção', 'reserva de emergencia seguro seguranca'),
  // Outros
  icon('favorite', 'Favorito', 'coracao amor pessoal'),
  icon('star', 'Estrela', 'destaque favorito'),
  icon('eco', 'Sustentável', 'natureza ecologia'),
  icon('recycling', 'Reciclagem', 'sustentavel lixo'),
  icon('category', 'Categoria', 'outros geral diversos'),
  icon('more_horiz', 'Outros', 'diversos mais geral'),
  icon('help_outline', 'Ajuda', 'duvida outros'),
];

const CATALOG_BY_NAME = new Map(ICON_CATALOG.map((option) => [option.name, option]));

/** Rótulo em português de um ícone; ícones fora do catálogo usam o próprio nome legível. */
export function iconLabel(name: string): string {
  return CATALOG_BY_NAME.get(name)?.label ?? name.replace(/_/g, ' ');
}

/**
 * Busca no catálogo por rótulo, palavras-chave e nome, sem acento e sem diferenciar maiúsculas.
 * Cada termo da busca precisa aparecer em algum desses textos. Busca vazia devolve tudo.
 */
export function searchIcons(query: string, catalog: readonly IconOption[] = ICON_CATALOG): IconOption[] {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...catalog];
  return catalog.filter((option) => {
    const haystack = normalizeText([option.label, option.name.replace(/_/g, ' '), ...option.keywords].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
}
