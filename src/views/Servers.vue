<template>
  <!-- <div style="margin: 30px; margin-top: 15px"> -->
  <div class="uk-container" style="margin-top:30px">
    <!-- <div class="uk-grid">
        <div class="uk-width-2-5 uk-text-right">
          <h4>Transfer Client
            <a uk-tooltip="pos:right"
               title="The Aspera client is built into the uploader. Rsync is only available for Mac and Linux. Unless otherwise instructed, you will use the Aspera transfer method.">
              <i class="fa fa-question-circle-o" aria-hidden="true"></i>
            </a>
          </h4>
        </div>

        <div class="uk-width-3-5">
          <label class="uk-form-label">
            <input type="radio" name="client" value="aspera" v-model="xferClient">
            Aspera
          </label>
          <label class="uk-form-label">
            <input type="radio" name="client" value="rsync" v-model="xferClient" :disabled="! rsyncAvailable">
            Rsync
          </label>
        </div>

      </div> -->

    <!-- <hr> -->

    <!--                           -->
    <!-- XNAT server configuration -->
    <!--                           -->

    <div class="uk-grid" style="padding-top: 40px">
      <div class="uk-width-2-5 uk-text-right">
        <h4>
          XNAT Server
          <a
            uk-tooltip="pos:right"
            title="You will need to have or create an account on the XNAT server you upload to."
          >
            <i class="fa fa-question-circle-o" aria-hidden="true"></i>
          </a>
        </h4>
      </div>

      <div class="uk-width-3-5">
        <!-- XNAT Server Selector -->
        <div
          class="uk-button uk-form-select uk-align-center"
          data-uk-form-select
          style="padding:0"
        >
          <div v-if="servers.xnat.list.length == 0">
            <select class="uk-select">
              <option>None configured</option>
            </select>
          </div>
          <div v-else>
            <select v-model="servers.xnat.selected" class="uk-select">
              <option
                v-for="s in servers.xnat.list"
                v-bind:value="servers.xnat.list.indexOf(s)"
              >
                {{ s.username + " @ " + s.hostname }}
              </option>
            </select>
          </div>
        </div>

        <!-- XNAT Buttons -->
        <div style="margin-top: -25px">
          <button
            class="uk-button uk-button-primary"
            href="#xnat-server-modal"
            @click="addXnatServer"
            uk-toggle
          >
            <i class="fa fa-plus-square-o" aria-hidden="true"></i>
          </button>
          <button
            class="uk-button uk-button-default"
            @click="editXnatServer"
            :disabled="servers.xnat.list.length == 0"
            href="#xnat-server-modal"
            uk-toggle
          >
            <i class="fa fa-edit" aria-hidden="true"></i>
          </button>
          <button
            class="uk-button uk-button-danger"
            uk-toggle="target: #remove-xnat-modal"
            type="button"
            :disabled="servers.xnat.list.length == 0"
          >
            <i class="fa fa-minus-square-o" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Remove server modal -->
    <div id="remove-xnat-modal" uk-modal>
      <div class="uk-modal-dialog uk-modal-body">
        <h2 class="uk-modal-title">Remove XNAT Server</h2>
        <p v-if="servers.xnat.list[servers.xnat.selected]">
          Are you sure you want to remove
          <b>{{ servers.xnat.list[servers.xnat.selected].hostname }}</b> from
          the server list?
        </p>
        <p class="uk-text-right">
          <button
            class="uk-button uk-button-default uk-modal-close"
            type="button"
          >
            Cancel
          </button>
          <button
            class="uk-button uk-button-danger"
            type="button"
            @click="deleteXnatServer"
          >
            Remove
          </button>
        </p>
      </div>
    </div>

    <hr />

    <!--                             -->
    <!-- Aspera server configuration -->
    <!--                             -->

    <div class="uk-grid">
      <div class="uk-width-2-5 uk-text-right">
        <h4>
          Aspera Server
          <a
            uk-tooltip="pos:right"
            title="You will be granted access to the Aspera server using the request below. Note, you will need to have outgoing 33001 TCP and UDP ports open for this to work."
          >
            <i class="fa fa-question-circle-o" aria-hidden="true"></i>
          </a>
        </h4>
      </div>

      <!-- <fieldset class="uk-fieldset" > -->

      <div class="uk-width-3-5">
        <div
          class="uk-button uk-form-select"
          data-uk-form-select
          style="padding:0"
        >
          <div v-if="xferClient != 'aspera'">
            <select class="uk-select" style="width:320px" disabled>
              <option>Not applicable</option>
            </select>
          </div>
          <div v-else-if="servers.asp.list.length == 0">
            <select class="uk-select" style="width:320px">
              <option>None configured</option>
            </select>
          </div>
          <div v-else>
            <select
              v-model="servers.asp.selected"
              class="uk-select"
              style="width:300px"
            >
              <option
                v-for="s in servers.asp.list"
                v-bind:value="servers.asp.list.indexOf(s)"
              >
                {{ s.hostname }}
              </option>
            </select>
          </div>
        </div>

        <!-- Aspera buttons -->
        <div style="margin-top: 5px">
          <button
            class="uk-button uk-button-primary"
            href="#xnat-server-modal"
            uk-toggle
            @click="addAsperaServer"
            disabled
          >
            <i class="fa fa-plus-square-o" aria-hidden="true"></i>
          </button>
          <button
            class="uk-button uk-button-default"
            @click="editAsperaServer"
            href="#xnat-server-modal"
            uk-toggle
            :disabled="servers.asp.list.length === 0"
            disabled
          >
            <i class="fa fa-edit" aria-hidden="true"></i>
          </button>
          <button
            class="uk-button uk-button-danger"
            @click="deleteAsperaServer"
            :disabled="servers.asp.list.length === 0"
            disabled
          >
            <i class="fa fa-minus-square-o" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>

    <hr />

    <!--                        -->
    <!-- Server modal templates -->
    <!--                        -->

    <!-- ADD XNAT Server Modal -->
    <div id="xnat-server-modal" uk-modal>
      <div class="uk-modal-dialog">
        <button
          id="modal-close-btn"
          class="uk-modal-close-default"
          type="button"
          uk-close
        ></button>
        <div class="uk-modal-header">
          <h2 class="uk-modal-title">{{ saveType }} XNAT Server</h2>
        </div>
        <div class="uk-modal-body">
          <form>
            <fieldset class="uk-fieldset">
              <div class="uk-margin">
                <div class="uk-inline">
                  <i class="uk-form-icon fa fa-server" aria-hidden="true"></i>
                  <input
                    v-model="modals.xnat.hostname"
                    class="uk-input"
                    type="text"
                    placeholder="Hostname"
                    style="width:540px"
                  />
                </div>
              </div>
              <div class="uk-margins">
                <div class="uk-inline">
                  <i class="uk-form-icon fa fa-user" aria-hidden="true"></i>
                  <input
                    v-model="modals.xnat.username"
                    class="uk-input"
                    type="text"
                    placeholder="Username"
                    style="width:540px"
                  />
                </div>
              </div>
              <div class="uk-margin">
                <div class="uk-inline">
                  <i class="uk-form-icon fa fa-lock" aria-hidden="true"></i>
                  <input
                    v-model="modals.xnat.password"
                    class="uk-input"
                    type="password"
                    placeholder="Password"
                    style="width:540px"
                  />
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        <div class="uk-modal-footer">
          <div class="uk-align-left" style="margin: -2px">
            <i
              v-if="servers.xnat.test == 'TESTING'"
              class="fa fa-circle-o-notch fa-spin fa-2x"
              aria-hidden="true"
              style="color:black"
            >
            </i>
            <i
              v-if="servers.xnat.test == 'OK'"
              class="fa fa-check fa-2x"
              aria-hidden="true"
              style="color:green"
            >
            </i>
            <i
              v-if="servers.xnat.test == 'ERROR'"
              class="fa fa-times fa-2x"
              aria-hidden="true"
              style="color:red"
            >
            </i>
          </div>
          <div class="uk-align-right">
            <button
              class="uk-button uk-button-default uk-modal-close"
              type="button"
            >
              Cancel
            </button>
            <button
              class="uk-button uk-button-secondary"
              type="button"
              @click="testXnatConnection"
              :disabled="
                modals.xnat.hostname == '' ||
                  modals.xnat.username == '' ||
                  modals.xnat.password == ''
              "
            >
              Test
            </button>
            <button
              type="button"
              class="uk-button uk-button-primary"
              @click="saveXnatServer"
              :disabled="
                modals.xnat.hostname == '' ||
                  modals.xnat.username == '' ||
                  modals.xnat.password == ''
              "
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD Aspera Server Modal -->
    <div id="aspera-server-modal" uk-modal>
      <div class="uk-modal-dialog">
        <button
          id="modal-close-btn"
          class="uk-modal-close-default"
          type="button"
          uk-close
        ></button>
        <div class="uk-modal-header">
          <h2 class="uk-modal-title">{{ saveType }} Aspera Server</h2>
        </div>
        <div class="uk-modal-body">
          <form>
            <fieldset class="uk-fieldset">
              <div class="uk-margin">
                <input
                  v-model="modals.asp.hostname"
                  class="uk-input"
                  type="text"
                  placeholder="Hostname"
                />
              </div>
            </fieldset>
          </form>
        </div>

        <!-- <p>Test: {{ authTest }}</p> -->
        <div class="uk-modal-footer uk-text-right">
          <button
            class="uk-button uk-button-default uk-modal-close"
            type="button"
          >
            Cancel
          </button>
          <button
            class="uk-button uk-button-secondary"
            type="button"
            @click="testAsperaConnection"
            disabled
          >
            Test
          </button>
          <button
            type="button"
            class="uk-button uk-button-primary"
            @click="saveAsperaServer"
            :disabled="modals.asp.hostname == ''"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <!--                    -->
    <!-- RSA key generation -->
    <!--                    -->

    <div class="uk-grid">
      <div class="uk-width-2-5 uk-text-right">
        <h4>
          Upload Access
          <a
            uk-tooltip="pos:right"
            title="The CCF team will need to grant access before you can upload DICOM. Please generate a request below."
          >
            <i class="fa fa-question-circle-o" aria-hidden="true"></i>
          </a>
        </h4>
      </div>

      <div class="uk-width-3-5">
        <button
          class="uk-button uk-button-secondary"
          uk-toggle="target: #generate-key-modal"
          :disabled="keypair.generated"
          @click="generateKeypair"
        >
          Request <i class="fa fa-key" aria-hidden="true"></i>
        </button>
        <button class="uk-button uk-button-default" @click="resetKeypair">
          Reset
        </button>
      </div>
    </div>

    <!-- RSA Generation Modal -->
    <div id="generate-key-modal" uk-modal>
      <div class="uk-modal-dialog">
        <div class="uk-modal-body">
          <h4>Request Upload Access</h4>
          <p class="uk-text-small">
            We have generated a unique RSA key pair that will be used to grant
            access to upload DICOM images to the CCF. Please copy the text below
            the line and email the information to
            <a :href="'mailto:' + adminEmail">{{ adminEmail }}</a
            >. We will respond when the public key has been installed and you
            are able to upload.
          </p>
          <hr />
          <!-- Only render if there are servers, otherwise error -->
          <div id="clipboard-content" v-if="servers.xnat.list.length > 0">
            <p class="uk-text-small" style="line-height: 0px; font-size:11px">
              Transfer client: {{ xferClient }}
            </p>
            <!-- <p class="uk-text-small" style="line-height: 0px; font-size:11px">XNAT server: {{ servers.xnat.list[servers.xnat.selected].hostname }}</p> -->
            <p class="uk-text-small" style="line-height: 0px; font-size:11px">
              Aspera server:
              {{ servers.asp.list[servers.asp.selected].hostname }}
            </p>
            <p class="uk-text-small uk-text-break" style="font-size:11px">
              {{ keypair.public }}
            </p>
          </div>
        </div>
        <div class="uk-modal-footer">
          <p class="uk-text-right">
            <!-- <button class="uk-button uk-button-default btn-clipboard" type="button" data-clipboard-target="#clipboard-content" data-clipboard-text="foo">Copy</button> -->
            <button
              class="uk-button uk-button-default uk-modal-close"
              type="button"
            >
              Got it
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const path = require("path");
const fs = require("fs");
const settings = require("electron-settings");
const keygen = require("ssh-keygen");
const app = require("electron").remote.app;
// const clipboard = require('clipboard')

function initModals() {
  return {
    asp: {
      hostname: ""
    },
    xnat: {
      hostname: "",
      username: "",
      password: ""
    }
  };
}

function testServers() {
  return {
    asp: {
      selected: 0,
      test: 0,
      list: [
        {
          hostname: "asp-connect1.wustl.edu"
        }
      ]
    },
    xnat: {
      selected: 0,
      test: "",
      list: [
        {
          hostname: "https://intradb.humanconnectome.org",
          username: "user",
          key: "secret",
          inbox: "/data/intradb/inbox"
        }
      ]
    }
  };
}

export default {
  data() {
    return {
      xferClient: "aspera",
      servers: testServers(),
      modals: initModals(),
      saveType: "", // edit or add
      keypair: {
        generated: false,
        public: "",
        path: "",
        comment: ""
      },
      password: "",
      adminEmail: app.adminEmail,
      rsyncAvailable: false
    };
  },
  created: function() {
    // console.log('loading config settings')
    if (settings.has("config")) {
      Object.assign(this.$data, settings.get("config"));
    } else {
      console.log("No existing settings. Creating new file.");
      settings.set("config", this.$data);
    }

    // Toggle Rsync functionality based on platform
    if (process.platform != "win32") {
      this.rsyncAvailable = true;
    }
  },
  beforeDestroy: function() {
    // console.log('saving server settings')
    // this.getInboxPath()
    // this.testXnatConnection()
    this.saveSettings();
  },
  methods: {
    addXnatServer: function() {
      this.modals = initModals();
      this.saveType = "Add";
      this.servers.xnat.test = "";
    },
    editXnatServer: function() {
      // Load the modal with selected server
      const i = this.servers.xnat.selected;
      const s = this.servers.xnat.list[i];
      this.modals.xnat.hostname = s.hostname;
      this.modals.xnat.username = s.username;
      this.modals.xnat.password = app.decrypt(s.key);
      this.saveType = "Edit";
      this.servers.xnat.test = "";
    },
    deleteXnatServer: function() {
      var modal = document.getElementById("remove-xnat-modal");
      modal.click();

      const i = this.servers.xnat.selected;
      const s = this.servers.xnat.list[i];
      // const selected = this.servers.xnat.selected

      console.log("-- deleting xnat server --");
      console.log("xnat.hostname = " + s.hostname);
      console.log("xnat.selected = " + i);

      // this.servers.xnat.list.pop(s)
      this.servers.xnat.list.splice(i, 1);
      this.servers.xnat.selected = 0;
    },
    saveXnatServer: function() {
      if (this.saveType == "Add") {
        this.servers.xnat.list.push(this.modals.xnat);
        // Set the selected server to last in list (the one just added)
        this.servers.xnat.selected = this.servers.xnat.list.length - 1;
        console.log("adding xnat server");
      } else if (this.saveType == "Edit") {
        const i = this.servers.xnat.selected;
        const mdl = this.modals.xnat;
        this.servers.xnat.list[i].hostname = mdl.hostname;
        this.servers.xnat.list[i].username = mdl.username;
        this.servers.xnat.list[i].key = app.encrypt(mdl.password);
      }
      var modal = document.getElementById("xnat-server-modal");
      modal.click();
      // this.getInboxPath()
      this.saveSettings();
    },

    addAsperaServer: function() {},

    editAsperaServer: function() {},

    deleteAsperaServer: function() {},

    saveAsperaServer: function() {},

    saveSettings: function() {
      // Clear the modal variables so we don't save password to file
      this.modals = initModals();
      // Make sure no passwords saved from previous versions
      for (var i = 0; i < this.servers.xnat.list.length; i++) {
        var server = this.servers.xnat.list[i];
        if (server.password) {
          console.log("Settings has a password. Encrypting it.");
          server.key = app.encrypt(server.password);
          server.password = "";
        }
      }
      settings.set("config", this.$data);
      settings.set("options.projects", []);
      settings.set("options.selectedProject", "");
    },
    getInboxPath: function() {
      // NOTE: not currently using since this xapi path is admin only
      console.log("getInboxPath invoked");
      var i = this.servers.xnat.selected;
      var hostname = this.servers.xnat.list[i].hostname;
      var auth = {
        username: this.servers.xnat.list[i].username,
        password: app.decrypt(this.servers.xnat.list[i].key)
      };

      app
        .httpGet(hostname, "/xapi/siteConfig/values/inboxPath", auth)
        .then(response => {
          this.servers.xnat.list[i].inbox = response.data.inboxPath;

          if (Object.keys(response.data).length == 0) {
            this.servers.xnat.list[i].inbox = "NO INBOX";
          }
          this.servers.xnat.test = "OK";
          this.saveSettings();
        })
        .catch(e => {
          this.servers.xnat.list[i].inbox = "INBOX ERROR";
          this.servers.xnat.test = "ERROR";
          console.log(e);
        })
        .then(() => {
          if (this.servers.xnat.list[i].inbox == "NO INBOX")
            alert(
              "This is a valid XNAT server but does not appear to have the required Inbox functionality. " +
                "Please email " +
                this.adminEmail
            );
        });
    },
    testXnatConnection: function() {
      this.servers.xnat.test = "TESTING";
      var hostname = this.modals.xnat.hostname;
      var auth = {
        username: this.modals.xnat.username,
        password: this.modals.xnat.password
      };
      console.log(
        "testing connection to " + hostname + " for user " + auth.username
      );

      app
        .httpGet(hostname, "/data/JSESSIONID", auth)
        .then(response => {
          this.servers.xnat.test = response.statusText;
        })
        .catch(e => {
          this.servers.xnat.test = "ERROR";
          console.log(e);
        });
    },
    testAsperaConnection: function() {},
    generateKeypair: function() {
      this.keypair.generated = true;
      this.keypair.path = path.join(
        path.dirname(settings._getSettingsFilePath()),
        "ccf_id_rsa"
      );
      console.log("Generating key pair at " + this.keypair.path);

      var _this = this;
      keygen(
        {
          location: path.normalize(this.keypair.path),
          // comment: 'joe@foobar.com',
          password: false,
          read: true
        },
        function(err, out) {
          if (err) {
            return console.log("Error saving key pair: " + err);
          }
          console.log("private key: " + out.key);
          console.log("public key: " + out.pubKey);
          console.log(_this.xferClient);
          _this.keypair.public = out.pubKey;
          // Save settings here since the application will likely be closed
          // since the user will be awaiting feedback about server access
          _this.saveSettings();
        }
      );
    },
    resetKeypair: function() {
      this.keypair.generated = false;
      this.keypair.public = "";
      this.keypair.path = "";
      this.saveSettings();
    }
  }
};
</script>

<style></style>
