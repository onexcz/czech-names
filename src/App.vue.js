import { defineComponent } from 'vue';
export default defineComponent({
    name: 'App',
    data() {
        return {
            selectedGender: null,
            maleNames: [],
            femaleNames: [],
            isLoading: true,
            filters: {
                year: '',
                sortBy: 'alpha',
                searchText: '',
                includePluralNames: true
            },
            availableYears: [],
            namesByYear: {},
            displayedItems: []
        };
    },
    computed: {
        displayedNames() {
            if (!this.selectedGender)
                return [];
            let names = this.selectedGender === 'male' ? this.maleNames : this.femaleNames;
            // Apply text filter
            if (this.filters.searchText) {
                const searchTerm = this.filters.searchText.toUpperCase();
                names = names.filter(name => name.includes(searchTerm));
            }
            // Filter by year (for both sorting methods)
            if (this.filters.year) {
                const yearData = this.namesByYear[this.filters.year]?.[this.selectedGender] || {};
                names = names.filter(name => yearData[name]);
            }
            // Filter plural names
            if (!this.filters.includePluralNames) {
                names = names.filter(name => !name.includes(' '));
            }
            // If sorting by rank
            if (this.filters.year && this.filters.sortBy === 'rank') {
                const yearData = this.namesByYear[this.filters.year]?.[this.selectedGender] || {};
                return names
                    .map(name => ({
                    name,
                    rank: yearData[name] || ''
                }))
                    .sort((a, b) => {
                    const rankA = parseInt(a.rank.split('-')[0]);
                    const rankB = parseInt(b.rank.split('-')[0]);
                    return rankA - rankB;
                });
            }
            else {
                // Alphabetical sorting
                return names.sort().map(name => ({ name, rank: '' }));
            }
        }
    },
    methods: {
        async loadCSV(filePath) {
            try {
                const response = await fetch(filePath);
                const text = await response.text();
                const year = filePath.match(/\/(\d{4})\.csv$/)?.[1];
                if (year && !this.namesByYear[year]) {
                    this.namesByYear[year] = { male: {}, female: {} };
                }
                const names = text.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                    const [rank, name] = line.split(',').map(item => item.trim());
                    if (name) {
                        const upperName = name.toUpperCase();
                        // Store rank information
                        if (year) {
                            const gender = filePath.includes('/boys/') ? 'male' : 'female';
                            this.namesByYear[year][gender][upperName] = rank;
                        }
                        return upperName;
                    }
                    return null;
                })
                    .filter((name) => name !== null);
                return names;
            }
            catch (error) {
                console.error(`Error loading ${filePath}:`, error);
                return [];
            }
        },
        async loadAllNames() {
            try {
                const boysModules = import.meta.glob('/src/data/boys/*.csv');
                const girlsModules = import.meta.glob('/src/data/girls/*.csv');
                // Extract available years from file paths
                const years = [
                    ...Object.keys(boysModules).map(path => path.match(/\/(\d{4})\.csv$/)?.[1]),
                    ...Object.keys(girlsModules).map(path => path.match(/\/(\d{4})\.csv$/)?.[1])
                ].filter((year) => year !== undefined);
                this.availableYears = [...new Set(years)]
                    .sort((a, b) => parseInt(b) - parseInt(a)); // Sort years descending
                // Load boys names
                const boysPromises = Object.keys(boysModules).map(path => this.loadCSV(path));
                const boysNamesArrays = await Promise.all(boysPromises);
                const boysSet = new Set(boysNamesArrays.flat());
                this.maleNames = [...boysSet];
                // Load girls names
                const girlsPromises = Object.keys(girlsModules).map(path => this.loadCSV(path));
                const girlsNamesArrays = await Promise.all(girlsPromises);
                const girlsSet = new Set(girlsNamesArrays.flat());
                this.femaleNames = [...girlsSet];
                this.isLoading = false;
            }
            catch (error) {
                console.error('Error loading names:', error);
                this.isLoading = false;
            }
        }
    },
    mounted() {
        this.loadAllNames();
    }
}); /* PartiallyEnd: #3632/script.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("app-container") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("info-section") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: ("info-text") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: ("info-text") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.em, __VLS_intrinsicElements.em)({});
    if (__VLS_ctx.isLoading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("loading") },
        });
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("gender-selection") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((__VLS_ctx.isLoading))))
                        return;
                    __VLS_ctx.selectedGender = 'male';
                } },
            ...{ class: ("gender-card male") },
            ...{ class: (({ active: __VLS_ctx.selectedGender === 'male' })) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: ("fas fa-mars") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(!((__VLS_ctx.isLoading))))
                        return;
                    __VLS_ctx.selectedGender = 'female';
                } },
            ...{ class: ("gender-card female") },
            ...{ class: (({ active: __VLS_ctx.selectedGender === 'female' })) },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
            ...{ class: ("fas fa-venus") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        if (__VLS_ctx.selectedGender) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("filters") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("filters-row") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("filter-group") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: ("year"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                id: ("year"),
                value: ((__VLS_ctx.filters.year)),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: (""),
            });
            for (const [year] of __VLS_getVForSourceType((__VLS_ctx.availableYears))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: ((year)),
                    value: ((year)),
                });
                (year);
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("filter-group") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: ("sort"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                id: ("sort"),
                value: ((__VLS_ctx.filters.sortBy)),
                title: ((!__VLS_ctx.filters.year && __VLS_ctx.filters.sortBy === 'rank' ? 'Pro řazení podle pořadí nejdříve vyberte rok' : '')),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("alpha"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: ("rank"),
                disabled: ((!__VLS_ctx.filters.year)),
            });
            (!__VLS_ctx.filters.year ? '(nejdříve vyberte rok)' : '');
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("filter-group") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                for: ("search"),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input, __VLS_intrinsicElements.input)({
                id: ("search"),
                type: ("text"),
                value: ((__VLS_ctx.filters.searchText)),
                placeholder: ("Filtrovat jména..."),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("filter-group checkbox-group") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: ("checkbox-label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.input, __VLS_intrinsicElements.input)({
                type: ("checkbox"),
            });
            (__VLS_ctx.filters.includePluralNames);
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("checkbox-text") },
            });
        }
        if (__VLS_ctx.selectedGender) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("names-list") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (__VLS_ctx.selectedGender === 'male' ? 'chlapce' : 'dívky');
            __VLS_elementAsFunction(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({});
            for (const [item] of __VLS_getVForSourceType((__VLS_ctx.displayedNames))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                    key: ((item.name)),
                });
                if (__VLS_ctx.filters.sortBy === 'rank') {
                    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: ("rank") },
                    });
                    (item.rank);
                }
                (item.name);
            }
        }
    }
    ['app-container', 'info-section', 'info-text', 'info-text', 'loading', 'gender-selection', 'gender-card', 'male', 'active', 'fas', 'fa-mars', 'gender-card', 'female', 'active', 'fas', 'fa-venus', 'filters', 'filters-row', 'filter-group', 'filter-group', 'filter-group', 'filter-group', 'checkbox-group', 'checkbox-label', 'checkbox-text', 'names-list', 'rank',];
    var __VLS_slots;
    var $slots;
    let __VLS_inheritedAttrs;
    var $attrs;
    const __VLS_refs = {};
    var $refs;
    var $el;
    return {
        attrs: {},
        slots: __VLS_slots,
        refs: $refs,
        rootEl: $el,
    };
}
;
let __VLS_self;
//# sourceMappingURL=App.vue.js.map