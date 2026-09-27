// ============================================================
// eslint.config.mjs
// Configuración de ESLint para el frontend de AgroControl.
//
// ESLint revisa el código y avisa de errores y malas prácticas.
// Se ejecuta con:  pnpm run lint
// ============================================================

// tseslint: reglas para TypeScript
import tseslint from 'typescript-eslint';

// angular: reglas propias de Angular (plantillas, selectores, etc.)
import angular from 'angular-eslint';

export default tseslint.config(
  {
    // ---- Archivos TypeScript (código de las clases) ----
    files: ['src/**/*.ts'],

    extends: [
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],

    // Permite ver el código de las plantillas HTML dentro de los avisos
    processor: angular.processInlineTemplates,

    rules: {
      // Los componentes deben llamarse "app-algo" (kebab-case)
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],

      // Nombra las variables y funciones en camelCase
      '@angular-eslint/no-output-native': 'off',

      // avisos, no errores graves: no rompen la compilación
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  {
    // ---- Archivos HTML (plantillas de los componentes) ----
    files: ['src/**/*.html'],

    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],

    rules: {
      // Avisamos de los botones sin type, pero no es grave
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',

      // En nuestras plantillas la etiqueta va pegada al input (sin
      // atributo "for"), así que lo dejamos solo como aviso.
      '@angular-eslint/template/label-has-associated-control': 'warn',

      // Esta regla pide usar la sintaxis nueva de Angular (@if, @for,
      // @switch). Nosotros usamos a propósito la sintaxis clásica
      // (*ngIf, *ngFor, ngSwitch), que es la que se explica en el curso.
      '@angular-eslint/template/prefer-control-flow': 'off',
    },
  },

  // Ignoramos carpetas que no son código nuestro
  {
    ignores: ['dist/**', 'node_modules/**', '.angular/**'],
  }
);
