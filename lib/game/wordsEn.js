/**
 * Vocabulário en — palavras frequentes do inglês, minúsculas, sem pontuação.
 * Mesmo perfil de tamanho do pt-BR para o WPM ser comparável entre partidas.
 */
export const WORDS_EN = `
the be to of and a in that have it for not on with he as you do at this but his
by from they we say her she or an will my one all would there their what so up
out if about who get which go me when make can like time no just him know take
people into year your good some could them see other than then now look only
come its over think also back after use two how our work first well way even
new want because any these give day most us very great little own old right
big high different small large next early young important few public bad same
able last long other point world hand part child eye woman place week case
number group problem fact life home water room mother area money story month
lot study book job word business issue side kind head house service friend
father power hour game line end member law car city community name president
team minute idea kid body information back parent face others level office door
health person art war history party result change morning reason research girl
guy moment air teacher force education foot boy age policy process music market
sense nation plan college interest death experience effect class control care
field development role effort rate heart drug show leader light voice wife
police mind price report decision son view relationship town road arm difference
thing value building action model season society tax director position player
record paper space ground form event official matter center couple site project
activity star table need court oil situation cost industry figure street image
phone data picture practice piece land product doctor wall patient worker news
test movie north love support technology step baby computer type attention film
tree source organization hair window evidence population truth song energy
keep let begin seem help talk turn start might run move live believe hold bring
happen write provide sit stand lose pay meet include continue set learn lead
understand watch follow stop create speak read allow add spend grow open walk
win offer remember consider appear buy wait serve die send expect build stay
fall cut reach kill remain suggest raise pass sell require decide return explain
hope develop carry break receive agree support hit produce eat cover catch draw
choose quick fast slow quiet loud bright dark warm cold clear simple easy hard
always never often again still already soon later today tonight tomorrow ever
key type rush clock second focus speed flow rhythm streak score round sprint
`
  .trim()
  .split(/\s+/)
  .filter((word, i, all) => all.indexOf(word) === i);
