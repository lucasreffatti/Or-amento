---
name: senior-fullstack
description: Padrões de Arquitetura Sênior para Next.js 16 (App Router) + Prisma + Tailwind
---

# 🧠 Senior Full Stack Guidelines (Next.js 16 + Prisma)

Este documento define os rigorosos padrões de engenharia de software sênior aplicados neste projeto (ERP de Oficina Mecânica). A IA **DEVE** seguir essas regras antes de escrever, refatorar ou analisar qualquer código.

## 1. Tratamento de Erros e Defensividade
* **Nunca confie no input do usuário ou de APIs externas.** Valide TODOS os dados de entrada usando tipagem forte.
* **Server Actions seguras:** Toda Server Action que muta dados (Create, Update, Delete) deve possuir um bloco `try/catch`, realizar validação de sessão/autenticação, e retornar erros padronizados (ex: `{ success: false, message: 'Erro detalhado' }`) em vez de simplesmente lançar exceções não tratadas para o cliente.
* **UI Resiliente:** Utilize tratamentos visuais (ex: `toast` notifications ou mensagens de erro in-line) para feedback de falhas no Client.

## 2. Performance e Otimização de Banco de Dados (Prisma)
* **Evite o problema de N+1 Queries:** Use `include` ou `select` no Prisma de forma consciente para buscar dados relacionados numa única query, se necessário.
* **Paginação:** Para tabelas grandes (ex: Histórico de NF-e, Estoque), implemente paginação `take`/`skip` ou cursores em vez de baixar milhares de registros.
* **Índices:** Assegure que os campos frequentemente buscados (ex: `tenantId`, `code`, `document`) possuem índices no `schema.prisma` (`@@index([campo])`).

## 3. Estado e Caching (Next.js App Router)
* **Revalidação Estratégica:** Use `revalidatePath` em Server Actions após mutações para invalidar o cache da rota afetada, mas evite abusar de revalidação global desnecessária.
* **Componentes de Servidor vs Cliente:** 
  * Priorize **Server Components** por padrão (para buscar dados e renderizar de forma segura sem vazar secrets).
  * Use **Client Components** (`'use client'`) ESTRITAMENTE quando houver interatividade (useState, onClick, useEffect, etc.).
  * Mantenha as Server Actions em arquivos separados (`actions/*.ts`) para organização.

## 4. UI/UX e Tipagem (Tailwind + TypeScript)
* **Tipagem Estrita (TypeScript):** Evite o uso de `any`. Defina interfaces/types precisos para props de componentes e retornos de funções.
* **Estética Minimalista Sênior:** 
  * A UI deve ser funcional, de altíssima densidade de informação sem parecer poluída.
  * Use estados de "Loading" consistentes para botões (ex: botão desabilitado + spinner/texto "Salvando...").
  * Preste atenção em feedback tátil visual (`hover:`, `focus:ring-`, `disabled:opacity-50`).

## 5. Manutenibilidade (Clean Code)
* **Pequenas Funções e Componentes:** Se um arquivo ou componente passar de 300 linhas, ele deve ser avaliado para divisão em subcomponentes ou hooks lógicos (`useFeature`).
* **Comentários de "Por Que", não de "O Que":** O código legível explica o que está acontecendo; os comentários devem explicar o motivo de uma decisão técnica complexa.
