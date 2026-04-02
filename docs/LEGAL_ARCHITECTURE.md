# Arquitectura Legal — Riscos e Salvaguardas

## 🚨 Decisão Bloqueante

O QR code de confirmação e o histórico de visitas são features viáveis — mas apenas com arquitectura de responsabilidade correcta.

Construídas de forma errada, criam dois riscos simultâneos:
- **Responsabilidade civil** por falhas do sistema
- **Evidência de controlo laboral** que pode reclassificar profissionais como trabalhadores da Evyra (Art. 12.º-A)

**Bloqueio:** Nenhuma destas features entra no roadmap formal sem parecer jurídico escrito às questões 1, 2 e 3 da secção final.

---

## ⚖️ Contexto Legal — Instrumentos Aplicáveis

### Art. 12.º-A — Código do Trabalho PT (2023)
**Presunção de relação laboral em plataformas digitais**

É acionada quando a plataforma:
- Fixa preços ou remunerações
- **Controla horários ou localização**
- **Supervisiona a execução do trabalho**
- Restringe autonomia do prestador
- É a única ou principal fonte de rendimento

**Risco directo das features:**  
Um sistema de QR code que a Evyra gera, valida e reporta pode ser lido como supervisão da execução do trabalho (i.e., confirmação de presença imposta pela plataforma).

---

### DL 84/2021 Art. 44º — Responsabilidade Solidária
**Responsabilidade conjunta da plataforma por danos ao consumidor**

A plataforma responde quando:
- Exerce controlo sobre aspectos do serviço
- Cria expectativa razoável de garantia
- Detém dados que influenciam a decisão do consumidor

**Risco directo das features:**  
Um histórico de visitas gerado e alojado na Evyra cria expectativa de que a plataforma certifica o conteúdo. Se o histórico registar atos errados (medicação incorrecta, omissão de cuidado), a família vai processar tanto o profissional como a Evyra.

---

## 📊 Análise de Risco por Feature

### 📱 Feature A — QR Code de Confirmação de Presença

#### ❌ Arquitectura de Risco

| Elemento | Risco |
|----------|-------|
| Plataforma gera QR e valida a leitura | Supervisão técnica do sistema |
| Pagamento bloqueado se QR não for lido | Coerção — controlo da execução |
| Plataforma reporta "presença confirmada" | Certificação de facto |
| Copy: "a Evyra garante que chegou" | Responsabilidade civil por falhas |

**Consequência:** Supervisão do trabalho pela plataforma → Risco Art. 12.º-A + responsabilidade solidária

#### ✅ Arquitectura Segura

| Elemento | Salvaguarda |
|----------|-------------|
| Profissional escolhe confirmar presença voluntariamente | Acto do profissional, não obrigação |
| Confirmação não bloqueia pagamento | Sem coerção — sem controlo |
| Plataforma regista: "profissional confirmou às HH:MM" | Registo de comunicação, não certificação |
| Copy: "sabe quando o profissional confirmou" | Visibilidade, não garantia |

**Consequência:** Acto do profissional, Evyra é canal → Risco minimizado

---

### 📋 Feature B — Histórico / Diário de Visita

#### ❌ Arquitectura de Risco

| Elemento | Risco |
|----------|-------|
| Plataforma define campos obrigatórios | Instrução de trabalho |
| Pagamento condicionado ao preenchimento | Coerção — controlo de execução |
| Plataforma valida ou certifica conteúdo | Responsabilidade por veracidade |
| Família assume que a Evyra garante veracidade | Expectativa de garantia criada |

**Consequência:** Controlo do processo de trabalho → Risco Art. 12.º-A + responsabilidade por conteúdo falso

#### ✅ Arquitectura Segura

| Elemento | Salvaguarda |
|----------|-------------|
| Campos são opcionais, sugeridos pelo profissional | Autonomia do profissional |
| Preenchimento não afecta pagamento | Sem coerção |
| Registo é do profissional, partilhado com família | Comunicação entre partes |
| Evyra é repositório, não validador | Plataforma é infraestrutura |

**Consequência:** Comunicação entre partes → Responsabilidade é do autor do registo

---

## ⚠️ Como o QR Code Deve Funcionar — Versão Segura (Passo-a-Passo)

1. **QR code é gerado diariamente** pela plataforma e **entregue à família** (não ao profissional)
   - Evyra gera a ferramenta
   - Família recebe o código
   - Profissional não recebe pressão de qualquer lado

2. **O profissional, quando chega, pede o QR à família** e faz o scan — **acto voluntário, iniciado pelo profissional**
   - A decisão é do profissional: "vou confirmar"
   - Ou: "não preciso confirmar hoje"
   - Evyra não intervém nesta decisão

3. **A plataforma regista:** "o profissional X fez scan do QR às HH:MM" — **não** "confirmou presença"
   - Linguagem de acto (scan) não de resultado (confirmação)
   - Sem interpretação pela plataforma

4. **Não há bloqueio de pagamento** por ausência de scan — **há flag visível** para a família
   - Sem coerção
   - Informação apenas (visibilidade)
   - Decisão deixada à família se continua com profissional

5. **Termos de serviço deixam explícito:**  
   > "O QR code é uma ferramenta de comunicação voluntária. O scan não é certificação de presença, verificação de qualidade, ou confirmação de que os cuidados foram prestados. A Evyra não monitora, supervisiona, nem garante a execução do trabalho. A responsabilidade pela prestação de cuidados é exclusiva do profissional."

---

## Os 4 Princípios de Arquitectura Legal — Não Negociáveis

### 1️⃣ Confirmação é Acto do Profissional, Não Obrigação da Plataforma

A Evyra disponibiliza a ferramenta. O profissional decide usá-la. A confirmação nunca bloqueia pagamento nem gera penalização automática — apenas cria visibilidade para a família.

**Implementação:**
- Sem campos obrigatórios
- Sem bloqueios de pagamento
- Sem relatórios de "falha de confirmação"

### 2️⃣ O Histórico é Registo do Profissional — A Evyra Não Valida Nem Certifica

Nos termos de serviço e em toda a UX:

> "Este registo foi criado pelo profissional e partilhado através da Evyra. A Evyra não verifica, valida, nem certifica o seu conteúdo. O profissional é o único responsável pela veracidade e exactidão dos registos."

Sem esta cláusula, a plataforma fica exposta a responsabilidade por conteúdo de terceiros.

**Implementação:**
- Rodapé em cada registo: "Criado por [Profissional]"
- Badge visual: "Comunicação partilhada" (não "verificado")
- T&C com cláusula explícita de disclaimer

### 3️⃣ Copy Usa Linguagem de Visibilidade — Nunca de Garantia

| ❌ Garantia (Risco) | ✅ Visibilidade (Seguro) |
|---------|-----------|
| A Evyra **garante** que o profissional chegou | **Saiba quando** o profissional confirmou a chegada |
| **Monitorize** o cuidado em tempo real | **Acompanhe** as actualizações partilhadas pelo profissional |
| **Confirme** que o cuidado está a acontecer | **Fique a par** do que o profissional partilha sobre a visita |
| A Evyra **verifica** a qualidade dos cuidados | Histórico de **comunicações** entre família e profissional |

**Implementação:**
- Audit de todas as páginas públicas, copy e UX
- Substitute em templates e translations

### 4️⃣ Termos de Serviço Separam a Evyra do Acto de Cuidado — Explicitamente

**Cláusula obrigatória nos T&C:**

> "A Evyra é uma infraestrutura de comunicação e organização. O serviço de apoio domiciliário é prestado pelo profissional, contratado directamente pela família. A Evyra não é parte no contrato de prestação de serviços, não supervisiona o trabalho, não valida ou certifica a execução, e não é responsável por actos ou omissões dos profissionais ou pela qualidade dos cuidados prestados."

**Por quê:** Esta cláusula é o equivalente jurídico nos serviços ao que o EasyPay faz nos pagamentos — delegar responsabilidade para onde ela pertence.

---

## 🏛️ A Analogia dos Pagamentos — Aplicada às Features de Visibilidade

A Evyra já tem isto correcto nos pagamentos:

- **EasyPay** é o canal regulado (não a Evyra)
- **Família** liberta os fundos (não a plataforma)
- **Evyra** é infraestrutura (não garantidor)
- **Responsabilidade** é do autor da transacção

**O mesmo princípio deve aplicar-se às features de visibilidade:**

- **QR code** é o canal de comunicação
- **Profissional** faz o scan (não a plataforma)
- **Evyra** é infraestrutura (não supervisor)
- **Responsabilidade** é do autor do acto (profissional) e da qualidade (profissional)

Sem essa consistência, a arquitectura toda fica inconsistente e um advogado adversário vai encontrar a brecha.

---

## 📋 5 Questões para o Advogado — Bloqueio de Roadmap

**Custo estimado:** €500–€1.500  
**Timeline:** 2-3 semanas  
**Bloqueio:** Nenhuma destas features entra no roadmap formal sem respostas às questões 1, 2 e 3.

### Questão 1 — Controlo de Conteúdo (BLOQUEIO)

Se a Evyra define os campos do histórico (alimentação, medicação, estado geral, temperatura), isso constitui instrução de trabalho à luz do Art. 12.º-A?

**Por quê:** Se a resposta for "sim", o histórico fica inviável. Se for "sim, mas com estas modificações", precisamos aplicar.

### Questão 2 — Responsabilidade por Veracidade (BLOQUEIO)

Se o histórico regista medicação administrada incorrectamente e há consequência para o familiar (queda por sedação excessiva, alergia não reportada), a família vai processar o profissional, a Evyra, ou ambos?

**Por quê:** Esta resposta define exactamente o que os T&C têm de dizer.

### Questão 3 — Classificação de Relação Laboral (BLOQUEIO)

Um QR code gerado pela Evyra, validado pela Evyra, e reportado como "confirmação de presença" pela Evyra, constitui supervisão de trabalho para efeitos da presunção de relação laboral?

**Por quê:** Se "sim", o QR tem de ser reconfigurado completamente. Se "sim, mas", precisamos da modificação.

### Questão 4 — Seguro e Responsabilidade Civil

A actual apólice de responsabilidade civil da Evyra cobre:
- Falhas do sistema de QR (app cai, scan registado incorrectamente)?
- Conteúdo falso no histórico (medicação registada mas não administrada)?

**Por quê:** Pode ser necessário aumento de cobertura ou exclusão explícita.

### Questão 5 — Conformidade RGPD

A retenção de históricos de visitas (dados de saúde sensíveis) exige:
- Actualização da Declaração de Conformidade RGPD?
- Notificação explícita ao profissional sobre retenção?
- Mecanismo de acesso/rectificação/eliminação?

**Por quê:** Simplicidade operacional, mas conformidade mandatória.

---

## ✅ Checklist — Antes de Codificar

- [ ] Parecer jurídico obtido às questões 1, 2, 3
- [ ] Modificações aos T&C redigidas pelo advogado
- [ ] Cláusula de "não supervisão" adicionada e traduzida
- [ ] Copy auditada — zero ocorrências de "garante", "monitora", "verifica"
- [ ] Termos de serviço revistos por legal antes do launch
- [ ] Seguro de responsabilidade civil actualizado
- [ ] RGPD: Declaração de Conformidade actualizada

---

**Última actualização:** 2026-04-02  
**Status:** Documento de arquitectura — Pendente parecer jurídico formal
