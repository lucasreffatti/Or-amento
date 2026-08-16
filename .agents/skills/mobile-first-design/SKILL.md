---
name: mobile-first-design
description: Diretrizes rigorosas de arquitetura CSS e usabilidade mobile-first para prevenir overflow horizontal, garantir áreas de toque de 44px+ e layouts fluidos em smartphones.
---

# Skill: Mobile-First & Touch-Target Architecture

## Princípios Fundamentais

1. **Abordagem Mobile-First Nativa**:
   - Todo estilo base deve ser focado em telas de smartphones (320px+).
   - Use breakpoints (`sm:`, `md:`, `lg:`) exclusivamente para expandir a interface em telas maiores.

2. **Prevenção Total de Overflow Horizontal**:
   - `box-sizing: border-box` global.
   - Proibido usar larguras fixas em pixels em containers de layout (`width: 100%`, `max-width: 100%`).
   - Mídias e Canvas 3D com `max-width: 100%` e controle de aspecto responsivo (`aspect-[2/1]`).

3. **Áreas de Toque (Touch Targets de 44px x 44px Mínimo)**:
   - Todo elemento clicável em telas de toque (botões, seletores de cor, botões de câmera 3D, ícones de remoção) deve possuir área mínima navegável de 44px x 44px para facilidade de uso em dispositivos móveis.

4. **Gestos e Interceptação Touch 3D**:
   - Em elementos interativos como Canvas Three.js WebGL, usar `touch-action: none` ou suporte nativo a `OrbitControls` touch para permitir rotação 360° com um dedo e zoom por gesto de pinça sem causar rolagem acidental da página.
