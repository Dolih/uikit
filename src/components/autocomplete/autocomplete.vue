<template>
    <div
        ref="autocomplete"
        class="autocomplete"
        :class="{'autocomplete_focus': isFocus}"
        tabindex="-1"
        @focusin="onFocus"
        @focusout="onFocusout"
    >
      <div class="autocomplete__wrapper">
        <div class="autocomplete__selected" v-if="multiple && !chip">{{Array.isArray(multipleSelectedValueTitles) ? multipleSelectedValueTitles.join(', ') : ''}}</div>
        <div class="autocomplete__selected_chips" v-if="multiple && chip">
          <div
              v-for="(item, index) in multipleSelectedValueTitles"
              :key="index"
              class="chip"
          >
            <span>{{item}}</span>
            <span v-if="closable" class="chip__close">x</span>
          </div>
        </div>
        <input
            :value="getValue()"
            ref="autocompleteInput"
            class="autocomplete__input"
            @input="updateInputValue"
            :placeholder="label"
        >
      </div>
  
      <div
          ref="autocompleteDropdown"
          class="autocomplete__dropdown-button"
          tabindex="-1"
          @click="onChangeMenu"
      >
        <i v-if="isMenuOpen" class="material-icons">arrow_drop_up</i>
        <i v-else class="material-icons">arrow_drop_down</i>
  
      </div>
    </div>
    <teleport to="body">
      <div
          ref="dropdown"
          v-if="isMenuOpen"
          class="dropdown"
          :style="{'left': left+ 'px', 'top': top +'px'}"
      >
        <DynamicScroller
            class="dropdown__scroller"
            :items="itemsList"
            style="height: 100%"
            :min-item-size="minItemSize"
            emitUpdate
            @update="updateScroller"
            :key-field="valueKey"
        >
          <template v-slot="{item, index, active}">
            <DynamicScrollerItem :item="item" :active="active" :key="index">
              <div
                  class="item"
                  :style="{'minHeight': minItemSize + 'px'}"
              >
                <div
                    v-if="multiple"
                    class="item__select-button"
                    :class="[isSelectMultiple(item) >= 0 ? 'item__select-button_active' : null]"
                    @click="selectItem(item)"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="white" stroke-width="2">
                    <path d="M4 9L7.5 13L14 5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
  
                <div style="width: 100%" @click="selectItem(item)">
                  <slot
                      name="dropdownItem"
                      :item="item"
                  >
                    <div class="item__content">
                      <span>{{item[valueTitle]}}</span>
                    </div>
                  </slot>
                </div>
  
              </div>
            </DynamicScrollerItem>
          </template>
        </DynamicScroller>
      </div>
    </teleport>
  </template>
  <script setup lang="ts">
  import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
  import {DynamicScroller, DynamicScrollerItem} from "vue-virtual-scroller";
  import {LoadItems} from "./types";
  import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
  
  interface Item {
    [key: string]: string | number,
  }
  
  const props = withDefaults(defineProps<{
    valueKey?: keyof Exclude<Item, string>;
    valueTitle?: keyof Exclude<Item, string>;
    minItemSize: number;
    label: string;
    multiple?: boolean;
    chip?: boolean;
    closable?: boolean;
    loadItems: LoadItems<Item>
  }>(), {
    valueKey: 'id',
    valueTitle: 'title',
    multiple: false,
    chip: false,
    closable: false,
  });
  
  const autocomplete = ref<HTMLDivElement>();
  const autocompleteInput = ref<HTMLInputElement>();
  const autocompleteDropdown = ref<HTMLDivElement>();
  const dropdown = ref<HTMLDivElement>();
  
  /**
   * plugins
   */
  const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
      }, delay);
    }
  };
  const exists = (data: Item[] | string[], value: string | number): number => {
    if(!data.length) return -1;
  
    if(typeof data[0] === "string") {
      return (data as string[]).indexOf(value as string);
    } else {
      const foundItem = (data as Item[]).find(item => item[props.valueKey] === value);
      if(!foundItem) return -1;
      return (data as Item[]).indexOf(foundItem);
    }
  };
  
  /**
   * Логика работы фокуса и открытия меню
   */
  const isFocus = ref(false);
  const isMenuOpen = ref(false);
  
  const onFocus = (event: FocusEvent) => {
    if(autocompleteInput.value) autocompleteInput.value.focus();
    if(!isFocus.value) {
      const fromDropdownButton = (event.relatedTarget as HTMLElement)===(autocompleteDropdown.value as HTMLDivElement);
      const toAutocomplete = (event.target as HTMLElement) === (autocompleteInput.value as HTMLDivElement);
      if(!(fromDropdownButton && toAutocomplete)) isMenuOpen.value = true;
      isFocus.value = true;
    }
  };
  const onFocusout = (event: FocusEvent) => {
    if(!(event.currentTarget as HTMLElement).contains(event.relatedTarget as HTMLElement)) {
      if(autocompleteInput.value) autocompleteInput.value.blur();
      isFocus.value = false;
      if(event.relatedTarget) isMenuOpen.value = false;
    }
  };
  
  const onChangeMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
  };
  
  /**
   * Расчеты положения дропдауна
   */
  let resizeObserver: ResizeObserver;
  const autocompleteHeight = ref(0);
  const top = ref(0);
  const left = ref(0);
  watch(isMenuOpen, (val: boolean) => {
    if(val) {
      calculateDropdownMenuPosition();
    }
  }, {deep: true});
  const calculateDropdownMenuPosition = async () => {
    const rect = autocomplete.value!.getBoundingClientRect();
    const spaceBetween = window.innerHeight - (rect.top + rect.height + 8 + 300);
    if(spaceBetween > 0) {
      top.value = rect.top + rect.height + 8;
    } else {
      top.value = rect.top - 300 - 8;
    }
    console.log(spaceBetween);
    // top.value = rect.top + rect.height + 8;
    left.value = rect.left;
    await nextTick();
  };
  
  const resizeAutocompleteObserve = () => {
    if(!autocomplete.value) return;
    resizeObserver = new ResizeObserver(entries => {
      for(const entry of entries) {
        calculateDropdownMenuPosition();
        autocompleteHeight.value = entry.contentRect.height;
      }
    })
    resizeObserver.observe(autocomplete.value);
  };
  
  /**
   * Пагинация
   */
  const updateScroller = async (_startIndex: number, _endIndex: number, _visibleStartIndex: number, visibleEndIndex: number) => {
    if(lastLoadedIndex.value <= visibleEndIndex) await getItemsList();
  };
  const clearPaginationSettings = () => {
    skip.value = 0;
    isTotal.value = false;
    lastLoadedIndex.value = 0;
    itemsList.value = [];
  };
  
  /**
   * Работа с данными
   */
  
  const selected = defineModel<string | Item | Item[] | string[]>();
  const multipleSelectedValueTitles = computed(() => {
    if(!props.multiple) return false;
    return typeof selected.value === 'object' && Array.isArray(selected.value) && selected.value !== null
        ? (selected.value as Item[]).map((x: Item) => x[props.valueTitle]) : selected.value;
  });
  const isSelectMultiple = (item: any) => {
    if(!Array.isArray(selected.value)) selected.value = [];
    return exists(selected.value, typeof selected.value[0] === 'string' ? item : item[props.valueKey]);
  };
  
  const getValue = () => {
    if(props.multiple) return searchValue.value;
    return typeof selected.value === 'object' && !Array.isArray(selected.value) && selected.value !== null
        ? (selected.value as Item)[props.valueTitle] : selected.value;
  };
  const selectItem = (item: any) => {
    needUpdate.value = false;
    if(!props.multiple) selected.value = item;
    else {
      if(!Array.isArray(selected.value)) selected.value = [];
      const isExists = exists(selected.value, typeof selected.value[0] === 'string' ? item : item[props.valueKey]);
      isExists !== -1 ? selected.value.splice(isExists, 1) : selected.value.push(item);
    }
    if(!props.multiple) searchValue.value = '';
    if(props.multiple) {
      if(autocomplete.value) autocomplete.value.focus();
    } else {
      isMenuOpen.value = false;
    }
  };
  
  /**
   * Поиск
   */
  const searchValue = ref('');
  const needUpdate = ref(false);
  watch(searchValue, () => {
    if(!needUpdate.value) return;
    onDebouncedInput();
  });
  const onDebouncedInput = debounce(() => {
    clearPaginationSettings();
    getItemsList();
    needUpdate.value = false;
  }, 1000);
  
  const updateInputValue = (event: InputEvent) => {
    needUpdate.value = true;
    const target = event.target as HTMLInputElement;
    if(!props.multiple) selected.value = target.value;
    searchValue.value = target.value;
  };
  
  /**
   * Fetch Data
   */
  const isLoading = ref(false);
  const isTotal = ref(false);
  const itemsList = ref<Item[]>([]);
  const skip = ref(0);
  const take = computed(() => Math.ceil(300 / props.minItemSize));
  const lastLoadedIndex = ref(0);
  
  const getItemsList = async () => {
    if(isLoading.value || isTotal.value) return;
    try {
      isLoading.value = true;
      const data = await props.loadItems(skip.value, take.value, searchValue.value);
      itemsList.value.push(...data);
      lastLoadedIndex.value = itemsList.value.length - 1;
      skip.value += take.value;
      isTotal.value = data.length < take.value;
    } catch(e: any) {
      throw new Error(e);
    } finally {
      isLoading.value = false;
    }
  };
  
  onMounted(async () => {
    await getItemsList();
    resizeAutocompleteObserve();
  })
  onUnmounted(() => {
    resizeObserver.disconnect();
  });
  </script>
  <style scoped lang="scss">
  $main-color: white;
  $accent-color: #253B4D;
  $border-radius: 12px;
  
  $input-bg-color: #E8F2F9;
  $chip-bg-color: $accent-color;
  $chip-text-color: $main-color;
  $dropdown-bg-color: $main-color;
  $checkbox-color: $accent-color;
  $dropdown-btn-bg-color:  $accent-color;
  
  .autocomplete {
    display: flex;
    justify-content: space-between;
    width: 300px;
    min-height: 40px;
    box-sizing: border-box;
    background-color: $input-bg-color;
    border-radius: $border-radius;
    box-shadow: 0 0 16px 0 rgba(170, 175, 185, .2);
  
    padding: 8px;
  
    &_focus {
    }
  
    &__wrapper {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
    }
  
    &__selected {
      cursor: default;
  
      &_chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
    }
  
    .chip {
      display: flex;
      gap: 8px;
  
      background-color: $chip-bg-color;
      color: $chip-text-color;
      border-radius: 8px;
      padding: 2px 8px;
      font-size: 16px;
  
      cursor: default;
  
      &__close {
        align-self: center;
        justify-self: flex-end;
  
        display: grid;
        align-content: center;
        justify-content: center;
  
        width: 16px;
        height: 16px;
        background-color: $chip-text-color;
        color: $chip-bg-color;
        border-radius: 50%;
  
        font-size: 14px;
        line-height: 16px;
        font-weight: 500;
  
        cursor: pointer;
      }
    }
  
    &__input {
      width: 100%;
      height: 24px;
      border: none;
      outline: none;
      background-color: transparent;
      box-shadow: none;
    }
  
    &__dropdown-button {
      display: grid;
      align-items: center;
      justify-items: end;
      width: 48px;
      box-sizing: border-box;
  
      cursor: pointer;
  
      i {
        color: $dropdown-btn-bg-color;
      }
    }
  }
  
  .dropdown {
    position: fixed;
    width: 300px;
    height: 300px;
    background-color: $dropdown-bg-color;
    border-radius: $border-radius;
    box-shadow: 0 0 16px 0 rgba(170, 175, 185, .3);
    padding: 8px 16px;
    z-index: 10000;
  
    &__scroller{
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }
  }
  
  .item {
    display: flex;
    gap: 8px;
    align-items: center;
    border-bottom: 1px solid rgba(37, 59, 77, 0.2);
  
    cursor: pointer;
    transition: border-bottom-color 0.3s ease-in-out;
  
    &:hover {
      border-bottom-color: rgba(37, 59, 77, 0.8);
    }
    &__select-button {
      width: 22px;
      height: 22px;
      box-sizing: border-box;
      border: 2px solid $checkbox-color;
      border-radius: 4px;
      transition: all 0.3s ease-in-out;
      svg {
        opacity: 0;
      }
  
      &_active {
        background-color: $checkbox-color;
        svg {
          opacity: 1;
        }
      }
    }
    &__content {
  
    }
  }
  </style>