<template>
  <div class="uk-container" style="margin:50px; padding-top:20px">
    <div class="uk-grid">
      <div class="uk-width-1-2 uk-text-right">
        <h4>
          XNAT Project
          <a
            uk-tooltip="pos:right"
            title="This is the project where the session will be built on the selected XNAT server."
          >
            <i class="fa fa-question-circle-o" aria-hidden="true"></i>
          </a>
        </h4>
      </div>

      <div class="uk-width-1-2">
        <div
          class="uk-button uk-form-select uk-text-left"
          data-uk-form-select
          style="padding:0; width:230px"
        >
          <select v-model="selectedProject" class="uk-select">
            <option value="">{{ projectDropdownText }}</option>
            <option v-for="p in projects" v-bind:value="p">
              {{ p }}
            </option>
          </select>
        </div>
        <i
          class="fa fa-spinner fa-pulse fa-fw"
          :class="{ 'uk-hidden': !loadingProjects }"
        ></i>
      </div>
    </div>

    <hr />

    <div class="uk-grid">
      <div class="uk-width-1-2 uk-text-right">
        <h4>
          Single or Multiple Sessions
          <a
            uk-tooltip="pos:right"
            title="The uploader accepts a single directory, which must include either
            a single DICOM image session, or a set of subdirectories containing one image
            session per directory."
          >
            <i class="fa fa-question-circle-o" aria-hidden="true"></i>
          </a>
        </h4>
      </div>

      <div class="uk-width-1-2">
        <label class="radio">
          <input
            type="radio"
            name="count"
            value="single"
            v-model="uploadType"
          />
          Single
        </label>
        <label class="radio">
          <input
            type="radio"
            name="count"
            value="multiple"
            v-model="uploadType"
            v-on:change="uploadTypeChange"
          />
          Multiple
        </label>
      </div>
    </div>

    <hr />

    <div class="uk-grid">
      <div class="uk-width-1-2 uk-text-right">
        <h4>
          XNAT Label Setting
          <a
            uk-tooltip="pos:right"
            title="The XNAT subject and session labels can be user
            defined or derived from the DICOM headers. If uploading multiple sessions in a
            single directory at once, DICOM headers is the only option for this setting.
            Labels are pulled from Patient Name (0010,0010) and Patient ID (0010,0020)."
          >
            <i class="fa fa-question-circle-o" aria-hidden="true"></i>
          </a>
        </h4>

        <div v-if="labelsFrom == 'user'">
          <h6 style="margin-top:0">Subject Label</h6>
          <h6 style="margin-top:0">Session Label</h6>
        </div>
      </div>

      <div class="uk-width-1-2">
        <label class="radio">
          <input
            type="radio"
            name="labels"
            value="user"
            v-model="labelsFrom"
            :disabled="uploadType == 'multiple'"
          />
          User Defined
        </label>
        <label class="radio">
          <input
            type="radio"
            name="labels"
            value="dicom"
            v-model="labelsFrom"
          />
          DICOM Headers
        </label>

        <div v-if="labelsFrom == 'user'" style="padding-top:15px">
          <input
            v-model="subjectLabel"
            type="text"
            class="uk-input"
            placeholder="ABC123456"
          />
          <input
            v-model="sessionLabel"
            type="text"
            class="uk-input"
            placeholder="ABC123456_MR"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const app = require("electron").remote.app;
const settings = require("electron-settings");

function initForm() {}

export default {
  data() {
    return {
      projects: ["No writable projects"],
      selectedProject: "none",
      loadingProjects: false,
      projectDropdownText: "",
      uploadType: "single", // or 'mulitple'
      labelsFrom: "user", // or 'dicom'
      subjectLabel: "",
      sessionLabel: ""
    };
  },
  mounted: function() {
    this.loadSettings();
    this.getProjects();
    var btn = document.getElementById("next-btn");
    btn.removeAttribute("disabled");
  },
  beforeDestroy: function() {
    this.saveSettings();
  },
  methods: {
    loadSettings: function() {
      if (settings.has("options")) {
        Object.assign(this.$data, settings.get("options"));
      } else {
        console.log("Could not load settings. Creating new Settings file.");
        settings.set("options", this.$data);
      }
    },
    saveSettings: function() {
      settings.set("options.loadingProjects", true);
      settings.set("options.projectDropdownText", "");
      settings.set("options", this.$data);
    },
    getProjects: function() {
      console.log("getProjects invoked");
      this.loadingProjects = true;

      // Get host and auth from app settings
      var servers = settings.get("config.servers.xnat.list");
      var i = settings.get("config.servers.xnat.selected");
      var hostname = servers[i].hostname;
      var auth = {
        username: servers[i].username,
        password: app.decrypt(servers[i].key)
      };

      // NOTE: using old /data/projects call since xapi only works for admin
      app
        .httpGet(hostname, "/data/projects", auth)
        .then(response => {
          var projectList = response.data.ResultSet.Result;
          this.projects = [];
          for (var i = 0; i < projectList.length; i++) {
            this.projects.push(projectList[i].ID);
          }
          this.projects.sort();
          this.projectDropdownText = "Select a project";
        })
        .catch(e => {
          console.log(e);
          this.projectDropdownText = "Error getting projects";
        })
        .then(() => {
          // Display spinner for at least half a second
          setTimeout(() => {
            this.loadingProjects = false;
          }, 500);
        });
    },
    uploadTypeChange: function() {
      console.log("uploadTypeChange");
      if (this.uploadType == "multiple") {
        this.labelsFrom = "dicom";
      }
    }
  }
};
</script>

<style>
.gray {
  color: gray;
}
</style>
