import Autocomplete from './Autocomplete.vue';

export default {
  title: 'Components/Autocomplete',
  component: Autocomplete,
  argTypes: {
    multiple: { control: false },
    modelValue: { control: false },
    mainColor: { control: 'color' },
    accentColor: { control: 'color' },
    inputBgColor: { control: 'color' },
    textColor: { control: 'color' },
    borderRadius: { control: 'text' },
  },
};

const items = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  title: `Project ${i}`
}));

const loadItems = async (skip: number, take: number, search?: string) => {
  await new Promise(r => setTimeout(r, 200));
  return items.filter(i => i.title.toLowerCase().includes(search?.toLowerCase() || '')).slice(skip, skip + take);
};

const Template = (args) => ({
    components: { Autocomplete },
    setup() {
  
      return { args };
    },
      watch: {
        args: {
            handler() {
                const root = document.documentElement;
                root.style.setProperty('--main-color', args.mainColor);
                root.style.setProperty('--accent-color', args.accentColor);
                root.style.setProperty('--border-radius', args.borderRadius);
                root.style.setProperty('--input-bg-color', args.inputBgColor);
                root.style.setProperty('--text-color', args.textColor);
            }, 
            deep: true,
            immediate: true
        }, 
      },
    template: `<div ref="rootRef"><Autocomplete v-bind="args" /></div>`,
  });
  
const stylesArgs = {
    inputBgColor: '#E8F2F9',
    mainColor: 'white',
    accentColor: '#253B4D',  
    textColor: 'black',
    borderRadius: '12px',
}

export const Default = Template.bind({});
Default.args = {
    loadItems,
    modelValue: {id: 1, title: 'Project 1'},
    minItemSize: 36,
    label: 'Выберите проект',
    ...stylesArgs
};

export const Multiple = Template.bind({});
Multiple.args = {
    loadItems,
    modelValue: [{id: 1, title: 'Project 1'}, {id: 2, title: 'Project 2'}],
    multiple: true,
    minItemSize: 36,
    label: 'Выберите проект',
    chip: true,
    ...stylesArgs
};
