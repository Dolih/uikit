import { mount, VueWrapper } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Autocomplete from './Autocomplete.vue';

let globalIndex = 0;

const loadItemsMock = vi.fn(async (skip: number, take: number, search: string) => {
  const result: { id: number; title: string }[] = [];

  for (let i = 0; i < take; i++) {
    result.push({
      id: globalIndex,
      title: `Item ${globalIndex}`,
    });
    globalIndex++;
  }

  if (search) {
    return result.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));
  }

  return result;
});

describe('Autocomplete.vue', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(async () => {
    wrapper = mount(Autocomplete, {
      props: {
        label: 'Test autocomplete',
        minItemSize: 40,
        loadItems: loadItemsMock,
      },
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();
  });

  afterEach(() => {
    wrapper.unmount();
    loadItemsMock.mockClear();
  });

  it('рендерится с заданным плейсхолдером', () => {
    const input = wrapper.find('input.autocomplete__input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('placeholder')).toBe('Test autocomplete');
  });

  it('открывает и закрывает выпадающее меню при клике на кнопку', async () => {
    const dropdownBtn = wrapper.find('.autocomplete__dropdown-button');
    expect(wrapper.vm.isMenuOpen).toBe(false);

    await dropdownBtn.trigger('click');
    expect(wrapper.vm.isMenuOpen).toBe(true);

    await dropdownBtn.trigger('click');
    expect(wrapper.vm.isMenuOpen).toBe(false);
  });

  it('открывает меню при фокусе на инпут', async () => {
    const input = wrapper.find('input.autocomplete__input');

    await input.trigger('focusin');
    expect(wrapper.vm.isMenuOpen).toBe(true);
    expect(wrapper.vm.isFocus).toBe(true);
  });

  it('закрывает меню при уходе фокуса', async () => {
    const input = wrapper.find('input.autocomplete__input');

    await input.trigger('focusin');
    expect(wrapper.vm.isMenuOpen).toBe(true);

    await input.trigger('focusout', { relatedTarget: null });
    expect(wrapper.vm.isFocus).toBe(false);
    expect(wrapper.vm.isMenuOpen).toBe(false);
  });

  it('вызывает loadItems при монтировании и заполняет itemsList с уникальными элементами', async () => {
    expect(loadItemsMock).toHaveBeenCalled();
    expect(wrapper.vm.itemsList.length).toBeGreaterThan(0);

    const ids = wrapper.vm.itemsList.map((item: any) => item.id);
    const uniqueIds = Array.from(new Set(ids));
    expect(ids.length).toBe(uniqueIds.length);
  });

  it('обновляет введённый текст и вызывает загрузку данных с задержкой', async () => {
    vi.useFakeTimers();

    const input = wrapper.find('input.autocomplete__input');
    await input.setValue('new value');
    expect(wrapper.vm.searchValue).toBe('new value');

    expect(loadItemsMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();

    expect(loadItemsMock).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('выбирает элемент в одиночном режиме и закрывает меню', async () => {
    const item = wrapper.vm.itemsList[0];
    wrapper.vm.selectItem(item);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selected).toEqual(item);
    expect(wrapper.vm.isMenuOpen).toBe(false);
  });

  it('выбирает элементы в режиме мультивыбора и отображает выбранные значения', async () => {
    await wrapper.setProps({ multiple: true });
    const item1 = wrapper.vm.itemsList[0];
    const item2 = wrapper.vm.itemsList[1];

    wrapper.vm.selectItem(item1);
    wrapper.vm.selectItem(item2);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selected).toContain(item1);
    expect(wrapper.vm.selected).toContain(item2);

    expect(wrapper.find('.autocomplete__selected').text()).toContain(item1.title);
    expect(wrapper.find('.autocomplete__selected').text()).toContain(item2.title);
  });
});
