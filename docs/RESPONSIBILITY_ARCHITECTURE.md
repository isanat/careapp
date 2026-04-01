# Evyra — Arquitectura de Responsabilidades

## Princípio Fundamental

A Evyra é **infraestrutura que liga familias a profissionais**. Não é garantidor do cuidado nem responsável pela presença ou qualidade do serviço prestado. Esta distinção é crítica para:

- Enquadramento jurídico correcto (não é instituição de pagamento, não é instituição de cuidados)
- Linguagem de marketing defensável
- Termos de serviço conformes com RGPD/GDPR
- Mitigação de risco legal

---

## Distinção: Garantia vs Visibilidade

### ❌ Linguagem de Garantia (PROBLEMÁTICA)

*"A Evyra garante que o cuidador chegou"*
*"A Evyra confirma que o cuidado foi prestado"*
*"A Evyra é responsável pela presença do profissional"*

**Problema:** A plataforma assume responsabilidade por um serviço que não controla. Se o cuidador não aparece ou o sistema falha, a Evyra é legalmente responsável.

### ✅ Linguagem de Visibilidade (CORRECTA)

*"O cuidador confirma a sua presença através da Evyra"*
*"A família sabe quando o profissional chegou"*
*"A Evyra fornece o histórico do que foi confirmado pelo profissional"*

**Vantagem:** A plataforma é o canal/ferramenta. A responsabilidade da confirmação está no profissional. A responsabilidade da presença efectiva permanece com o profissional e a família.

---

## Mapeamento de Responsabilidades

| Acção | Responsável | Papel da Evyra |
|-------|---|---|
| **Confirmação de Presença** | Profissional (via QR code) | Fornece o mecanismo, regista o scan |
| **Qualidade do Cuidado** | Profissional | Nenhum papel (fora do escopo) |
| **Pagamento Pontual** | Evyra | Processa e transfere fundos |
| **Verificação Inicial** | Evyra | Conduz, documenta, mantém registos |
| **Integridade do Registo** | Evyra | Mantém logs imutáveis do que foi confirmado |
| **Presença Efectiva** | Profissional + Família | Evyra apenas fornece informação |

---

## Feature: Confirmação de Presença via QR Code

### Como Funciona

1. **Geração:** A família gera um QR code aleatório diário (válido apenas 24h)
2. **Comunicação:** Partilha o QR code com o profissional (WhatsApp, email, impressão)
3. **Confirmação:** O profissional escaneia o QR code quando chega
4. **Registo:** A Evyra registou: `[timestamp] QR [xxx] escaneado por [profissional_id]`
5. **Visibilidade:** A família recebe notificação: *"QR confirmado em [hora]"*

### O Que Isto NÃO É

- ❌ Prova de qualidade do cuidado
- ❌ Prova de que o cuidado foi prestado integralmente
- ❌ Sistema de monitorização do profissional
- ❌ Garantia de presença (se o scan falha, a família não sabe se o profissional apareceu)

### O Que Isto É

- ✅ Confirmação voluntária de presença por parte do profissional
- ✅ Visibilidade para a família sobre quando a confirmação foi feita
- ✅ Acudit trail: registo de quem escaneou quando
- ✅ Ferramenta de comunicação estruturada

---

## Cláusulas de Termos de Serviço (Obrigatórios)

Antes do lançamento, os ToS devem incluir:

```
1. CONFIRMAÇÃO DE PRESENÇA
A Evyra fornece uma ferramenta de confirmação de presença voluntária 
(QR code). O acto de confirmação é responsabilidade do profissional. 
A Evyra não é responsável por:
- Falhas técnicas na confirmação
- Ausência de confirmação (se o profissional não escaneia)
- Confirmação fraudulenta (se o profissional escaneia mas não está presente)

2. RESPONSABILIDADE PELO CUIDADO
A Evyra não é responsável pela qualidade, duração ou conformidade do 
cuidado prestado. A responsabilidade pelo serviço contratado permanece 
com o profissional e é acordada directamente na família.

3. DADOS E PRIVACIDADE
Os registos de confirmação são dados pessoais sob RGPD. A Evyra 
processa estes dados como processadora (sob instrução da família). 
A família é responsável por consentimento e conformidade.
```

---

## Copy Guidelines

### Permitido ✅

- "Sabe quando o cuidador chegou"
- "O profissional confirma a sua presença"
- "Histórico de confirmações"
- "Visibilidade sobre check-ins"
- "Notificações de confirmação"

### Não Permitido ❌

- "A Evyra garante que o cuidador chegou"
- "Monitorização em tempo real do cuidador"
- "Prova de que o cuidado foi prestado"
- "A Evyra confirma a presença"
- "Acompanhamento do profissional"

---

## Alinhamento com Brand Canvas

Este princípio alinha-se com a definição do Canvas:

> *"A Evyra é infraestrutura digital de cuidado humano"*

Não é garantidor. Não é instituição de cuidados. É o sistema que liga, organiza e fornece visibilidade. A responsabilidade pelo cuidado permanece onde sempre esteve — com o profissional e a família.

Mesma lógica que protege a Uber: a Uber não garante que o motorista chega, fornece a ferramenta que mostra onde ele está.

---

## Decisão Registada

- **Data:** 2026-04-01
- **Decisor:** Arquitectura de Responsabilidades
- **Status:** Aprovado para implementação
- **Próximo:** Actualizar copy em todas as páginas públicas com linguagem de visibilidade
