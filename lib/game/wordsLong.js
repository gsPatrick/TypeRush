/**
 * Palavras longas (8+ letras) — entram aos poucos conforme a partida avança
 * (rampa de dificuldade). Somadas às palavras de 7+ letras do vocabulário base.
 */
export const LONG_PT_BR = `
  acontecimento administração adolescente aeroporto agradecimento alimentação
  apartamento aprendizado arquitetura assinatura atmosfera automóvel
  biblioteca brincadeira cachoeira calendário caminhoneiro característica
  chocolate cidadania comunicação computador comportamento conhecimento
  consequência construção contabilidade conversa coração cozinheiro
  democracia desenvolvimento despertador dicionário dificuldade
  educação eletricidade empresário encruzilhada enfermeira entretenimento
  equipamento escritório espetáculo estacionamento estrangeiro experiência
  fotografia felicidade ferramenta geladeira generosidade geografia
  helicóptero hospitalidade identidade imaginação importância independência
  informação inteligência investimento jornalista laboratório lembrança
  liberdade madrugada matemática medicamento movimento natureza
  oportunidade orçamento organização paciência paralelepípedo pensamento
  personagem possibilidade preocupação primavera professora programação
  publicidade qualidade quarentena relacionamento responsabilidade restaurante
  sabedoria segurança semelhança sentimento solidariedade supermercado
  tecnologia telefonema temperatura tranquilidade universidade velocidade
  vizinhança voluntário
`
  .trim()
  .split(/\s+/)
  .filter((word, i, all) => all.indexOf(word) === i);

export const LONG_EN = `
  absolutely accomplish adventure afternoon agreement alphabet apartment
  appreciate atmosphere attention basketball beautiful birthday breakfast
  calculator celebration challenge character chocolate classroom collection
  committee community comparison computer condition confidence connection
  conversation creativity curiosity dangerous delicious democracy description
  development dictionary difference direction discovery education electricity
  elephant emergency encyclopedia engineering entertainment environment
  equipment everything excellent experience explanation festival friendship
  generation government gratitude happiness helicopter historical hospital
  imagination important independent information instrument intelligence
  interesting knowledge laboratory landscape literature magazine management
  mathematics microphone motorcycle mountain negotiation neighborhood
  notebook opportunity organization particular passenger performance
  photograph playground population possibility president probability
  production professional programming question recognition refrigerator
  relationship remarkable restaurant scientific situation strawberry
  technology temperature together tomorrow tournament understanding
  university vegetable wonderful yesterday
`
  .trim()
  .split(/\s+/)
  .filter((word, i, all) => all.indexOf(word) === i);
