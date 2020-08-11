Vue.component("okr-component", {
  data() {
    return {
      newKR: "",
      newCount: 1,
      newUnit: "",
      validateErrors: [],
      showErrorTextarea: false,
      showErrorCount: false,
      showErrorUnit: false,
      showAddKeyResultForm: false,
      ObjectiveValue: 0,
      ObjectiveOptions: {
        dotSize: 10,
        min: 0,
        max: 100,
        disabled: true,
        tooltip: "none",
        lazy: true,
      },
    };
  },
  template: `
  <div class="okr">
    <div class="okr_container">
      <span class="okr_container__span">O </span>
      <h3 class="okr_container__title">{{okr.O}}</h3>
      <vueSlider 
        class="okr_container__slider"
        v-bind="ObjectiveOptions"
        v-model="ObjectiveValue"
      ></vueSlider>
      <p class="okr_container__value">{{ObjectiveValue}} <span>%</span></p>
      <i @click="$root.deleteOKR(okr.id)" class="fa fa-trash hover okr-icon"></i>
    </div>
    <kr-component v-for="kr in okr.KR" :kr="kr" :key="kr.id" :okr_id="okr.id"></kr-component>
    <div v-if="!showAddKeyResultForm" class="ml-auto icon-container">
      <button @click="showAddKeyResultForm=true" class="okr_form_container__button">
        <i class="fa fa-plus plus-icon"></i>
        Add a KR
      </button>
    </div>
    <div v-if="showAddKeyResultForm" class="kr_form_container">
        <span class="kr_form_container__span">KR </span>
        <textarea
          v-model="newKR"
          placeholder="Add new Key Result"
          class="kr_form_container__title focus-effect"
          :class="{'errorField':showErrorTextarea}"
          @keypress="showErrorTextarea=false"
          rows="3"
        ></textarea>
        <input
          v-model="newCount"
          placeholder="1"
          type="number"
          min="1"
          class="kr_form_container__input focus-effect"
          :class="{'errorField':showErrorCount}"
          @change="showErrorCount=false"
        />
        <input
          v-model="newUnit"
          placeholder="Add unit"
          type="text"
          class="kr_form_container__title focus-effect"
          :class="{'errorField':showErrorUnit}"
          @keypress="showErrorUnit=false"
        />
        <button
          @click="addKR(okr.id,newKR,newCount,newUnit)"
          class="kr_form_container__button add-new-button focus-effect"
        >
          Add
        </button>
        <i @click="showAddKeyResultForm=false;showErrorTextarea=false;showErrorCount=false;showErrorUnit=false;" class="fa fa-close close-icon hover"></i>
      </div>
  </div>`,
  props: ["okr"],

  components: {
    vueSlider: window["vue-slider-component"],
  },
  methods: {
    getCurrentTotalValueO() {
      if (this.getMaxValueKR != 0) {
        this.ObjectiveValue = parseInt(
          (this.getCurrentTotalValueKR * 100) / this.getMaxValueKR
        );
      } else {
        this.ObjectiveValue = 0;
      }
      this.okr.currentTotalValue = this.ObjectiveValue;
      this.$root.save();
    },
    addKR(id, newKR, newCount, newUnit) {
      if (!this.validate()) {
        this.$root.addKR(id, newKR, newCount, newUnit);
        this.getCurrentTotalValueO();
        this.newKR = "";
        this.newUnit = "";
        this.newCount = 1;
        this.showAddKeyResultForm = false;
      }
    },
    validate() {
      this.validateErrors = [];
      if (!this.newKR.length) {
        this.showErrorTextarea = true;
        this.validateErrors.push("Enter correct KR title");
      }
      if (!(parseInt(this.newCount) >= 1)) {
        this.showErrorCount = true;
        this.validateErrors.push("Enter correct count");
      }
      if (!this.newUnit.length) {
        this.showErrorUnit = true;
        this.validateErrors.push("Enter correct unit");
      }
      return this.validateErrors.length;
    },
  },
  computed: {
    getMaxValueKR() {
      return this.okr.KR.length * 100;
    },
    getCurrentTotalValueKR() {
      return this.okr.KR.reduce(
        (acc, element) => acc + (element.currentValue * 100) / element.count,
        0
      );
    },
  },
  mounted() {
    this.ObjectiveValue = this.okr.currentTotalValue;
  },
});

Vue.component("kr-component", {
  data() {
    return {
      KRValue: 0,
      KROptions: {
        dotSize: 10,
        min: 0,
        max: this.kr.count,
        tooltip: "active",
      },
    };
  },
  template: `
      <div  
      class="okr_container">
        <span class="okr_container__span">KR </span>
        <h4 class="okr_container__title okr_container__title_kr">{{kr.title}}</h4>
        <vueSlider 
        @change="getCurrentTotalValueO"
          class="okr_container__slider"
          v-model="KRValue"
          v-bind="KROptions"
        ></vueSlider>
        <p class="okr_container__value">
          {{KRValue}}
          <span class="okr_container__unit">{{kr.unit}}</span>  
        </p>
        <i @click="deleteKR(kr.id,okr_id)" class="fa fa-trash hover kr-icon"></i>
      </div>`,
  props: ["kr", "okr_id"],
  components: {
    vueSlider: window["vue-slider-component"],
  },
  methods: {
    getCurrentTotalValueO() {
      this.kr.currentValue = this.KRValue;
      this.$parent.getCurrentTotalValueO();
      this.$root.save();
    },
    deleteKR(id, okr_id) {
      this.$root.deleteKR(id, okr_id);
      this.getCurrentTotalValueO();
    },
  },
  mounted() {
    this.KRValue = this.kr.currentValue;
  },
});

const vm = new Vue({
  el: "#root",
  data: {
    newObjective: "",
    okrs: [],
  },
  methods: {
    addOKR() {
      this.okrs.push({
        id: id(),
        O: this.newObjective,
        KR: [],
      });
      this.newObjective = "";
      localStorage.setItem("OKRS", JSON.stringify(this.okrs));
    },
    deleteOKR(id) {
      if (!confirm("Do you really want to delete this Objective?")) {
        return;
      }
      this.okrs = this.okrs.filter((o) => o.id !== id);
      this.okrs.length
        ? localStorage.setItem("OKRS", JSON.stringify(this.okrs))
        : localStorage.removeItem("OKRS");
    },
    addKR(_id, title, count, unit) {
      const ind = this.okrs.findIndex((el) => el.id === _id);
      this.okrs[ind].KR.push({
        id: id(),
        title,
        unit,
        count: parseInt(count),
        currentValue: 0,
      });
    },
    deleteKR(id, okr_id) {
      if (!confirm("Do you really want to delete this Key Result?")) {
        return;
      }
      const ind = this.okrs.findIndex((el) => el.id === okr_id);
      this.okrs[ind].KR = this.okrs[ind].KR.filter((kr) => kr.id !== id);
      this.okrs.length
        ? localStorage.setItem("OKRS", JSON.stringify(this.okrs))
        : localStorage.removeItem("OKRS");
    },
    save() {
      localStorage.setItem("OKRS", JSON.stringify(this.okrs));
    },
  },
  mounted() {
    localStorage.getItem("OKRS")
      ? (this.okrs = JSON.parse(localStorage.getItem("OKRS")))
      : (this.okrs = []);
  },
});

function id() {
  return Math.floor(Math.random() * 1e5 * Date.now()).toString(36);
}
