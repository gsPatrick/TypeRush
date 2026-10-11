/**
 * Vocabulário pt-BR — palavras frequentes, minúsculas, com acentuação real.
 * Cerca de um terço tem acento, til ou cedilha: o suficiente para treinar
 * composição sem transformar a partida em prova de ortografia.
 */
export const WORDS_PT_BR = `
a o e de que em um uma para com não por mais como mas foi ao ele ela se na no
os as dos das seu sua ou quando muito nos já está eu também só pelo pela até
isso entre era depois sem mesmo aos ter seus quem nas me esse eles estão você
tinha foram essa num nem suas meu às minha têm numa pelos elas havia seja qual
será nós tenho lhe deles essas esses pelas este fosse dele tu te vocês vos lhes
meus minhas teu tua teus tuas nosso nossa nossos nossas dela delas esta estes
estas aquele aquela aqueles aquelas isto aquilo estou está estamos estive
tempo vida dia ano casa mundo coisa homem mulher parte lugar caso grupo mão
vez ponto governo país forma problema número trabalho fim água noite história
cidade pessoa família momento lado olho nome início questão rua mãe pai filho
amigo caminho corpo cabeça coração razão ação função atenção decisão opção
informação relação situação condição direção posição produção educação canção
nação lição missão visão versão sessão paixão pão mão chão irmão avião limão
café pé fé você até também ninguém alguém porém além armazém refém parabéns
já lá cá aí só nó pó dó avó avô bebê vovô três mês português inglês francês
fácil difícil útil possível incrível terrível horrível amável saudável estável
música público prático rápido lógico único último próximo médico técnico
história memória vitória glória matéria série espécie notícia polícia justiça
saúde país baú juízo saída raiz faísca egoísta conteúdo viúva miúdo
água mágoa régua língua pinguim frequente aguentar sequência
criança começo força cabeça praça maçã açúcar caçar laço braço espaço preço
moço poço pescoço almoço esforço serviço início exercício edifício artifício
ônibus tênis bônus vôlei estômago econômico atômico cômodo
lâmpada câmera pântano âncora ângulo cântico trânsito
então órgão bênção órfão sótão
bom bem mal novo velho grande pequeno alto baixo longo curto forte fraco
claro escuro quente frio cedo tarde sempre nunca agora hoje ontem amanhã
aqui ali onde quando como porque talvez quase ainda logo cada outro todo
fazer dizer ver dar saber querer chegar passar ficar poder deixar parecer
levar começar seguir encontrar chamar vir pensar sair voltar tomar conhecer
viver sentir criar falar trazer lembrar acabar perder entender escrever
ler correr andar jogar abrir fechar olhar ouvir pedir pagar mudar usar
digitar tecla rápido ritmo foco fluxo velocidade precisão relógio segundo
minuto hora contagem sequência recorde partida rodada desafio vitória
luz sol lua mar céu rio terra fogo vento chuva neve flor árvore folha pedra
cor som voz ideia sonho medo amor paz guerra força verdade mentira
livro papel letra palavra frase texto página caneta mesa porta janela
cidade estrada ponte prédio escola mercado praia campo floresta montanha
`
  .trim()
  .split(/\s+/)
  .filter((word, i, all) => all.indexOf(word) === i);
