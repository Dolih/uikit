export default {
    framework: {
      name: '@storybook/vue3-vite',
      options: {},
    },
    stories: ['../src/**/*.stories.@(js|ts|vue)'],
    addons: ['@storybook/addon-essentials'],
    async viteFinal(config, { configType }) {
      const { mergeConfig } = await import('vite');
      const vue = (await import('@vitejs/plugin-vue')).default;
      const vueJsx = (await import('@vitejs/plugin-vue-jsx')).default;
      const VueMacros = (await import('unplugin-vue-macros/vite')).default;
  
      return mergeConfig(config, {
        plugins: [
          VueMacros({
            defineModel: true,
            defineOptions: true,
            setupSFC: true,
          }),
          vue(),
          vueJsx(),
        ],
      });
    },
  };
  