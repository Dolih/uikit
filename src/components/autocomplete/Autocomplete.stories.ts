import Autocomplete from './Autocomplete.vue';

export default {
  title: 'Components/Autocomplete',
  component: Autocomplete,
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
  template: `<Autocomplete v-bind="args" v-model="args.modelValue" />`,
});

export const Default = Template.bind({});
Default.args = {
  minItemSize: 36,
  label: 'Выберите проект',
  loadItems,
  modelValue: {id: 1, title: 'Project 1'}
};
