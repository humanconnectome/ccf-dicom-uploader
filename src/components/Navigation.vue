<template>
  <div class="wrapper">

    <nav class="uk-navbar-container" uk-navbar style="height: 50px">
      <div class="uk-navbar-center">
        <ul class="uk-navbar-nav">
          <li class="uk-disabled" v-bind:class="isActive('servers')">
            <router-link to="/servers">1. Servers</router-link>
          </li>
          <li class="uk-disabled" v-bind:class="isActive('options')">
            <router-link to="/options">2. Options</router-link>
          </li>
          <li class="uk-disabled" v-bind:class="isActive('upload')">
            <router-link to="/upload">3. Upload</router-link>
          </li>
        </ul>
      </div>
    </nav>

    <div class="content">
      <router-view></router-view>
    </div>

    <div class="footer">
      <div class="uk-align-left" style="margin: 5px">
        <!-- Questions button -->
        <button class="uk-button uk-button-default" uk-toggle="target: #questions-modal" style="width:20px">
          <i class="fa fa-question fa-2x" aria-hidden="true" style="position:relative; top:5px; left:-10px; color:gray"></i>
        </button>
      </div>
      <div class="uk-align-right" style="margin: 5px">
        <button class="uk-button uk-button-danger app-button" style="width:110px" @click="exit">Exit</button>
        <button class="uk-button uk-button-default" id='back-btn' style="width:110px" v-bind:disabled="this.$route.name === 'servers'" @click="back">Back</button>
        <button class="uk-button uk-button-primary" id='next-btn' style="width:110px" @click="next">Next</button>
      </div>
    </div>

    <!-- Questions modal -->
    <div id="questions-modal" uk-modal>
      <div class="uk-modal-dialog uk-modal-body">
        <h2 class="uk-modal-title">Uploader Help</h2>
        <p>
          If you have any questions or find any bugs in the uploader, please contact
          <a :href="'mailto:'+adminEmail">{{ adminEmail }}</a>.
        </p>
        <p class="uk-text-right">
          <button class="uk-button uk-button-default uk-modal-close" type="button">OK</button>
        </p>
      </div>
    </div>

  </div>

</template>

<script>

  const app = require('electron').remote.app
  const settings = require('electron-settings')

  export default {
    data () {
      return {
        transferClient: '',
        adminEmail: app.adminEmail
      }
    },
    beforeCreate () {
      this.$router.push({ name: 'servers' })
      console.log("\ninside App.vue src directory:")
      console.log(__dirname + "\n")
    },
    methods: {
      exit: function () {
        // Clear some settings we don't want to keep between runs
        settings.set('options.projects', [])
        settings.set('options.subjectLabel', '')
        settings.set('options.sessionLabel', '')
        settings.set('config.password', '')
        window.close()
      },
      back: function () {
        // console.log("<-- going back")
        if (this.$route.name == 'options') {
          this.$router.push({ name: 'servers' })
        } else if (this.$route.name == 'upload') {
          this.$router.push({ name: 'options' })
        }
      },
      next: function () {
        // console.log("going forward -->")

        if (this.$route.name == 'servers') {
          this.$router.push({ name: 'options' })
        } else if (this.$route.name == 'options') {
          this.$router.push({ name: 'upload' })
        }
      },
      isActive: function (link) {
        return {
          'uk-active': this.$route.name === link
        }
      }
    }
  }
</script>

<style>
  uk-active: {
    font-weight: 900;
  }
</style>
