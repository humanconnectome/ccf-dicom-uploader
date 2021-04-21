<template>
  <div style="margin:5px">
    <!-- <p v-if="uploading" style="position:absolute; top:130px; left:318px">{{ elapsed }}</p> -->

    <div
      class="js-upload uk-placeholder uk-text-center"
      v-on:drop="getDroppedDirectory($event)"
    >
      <!-- change icon based on upload status    -->
      <i :class="statusIconComputed" class="statusIcon" aria-hidden="true"></i>

      <span class="uk-text-middle"></span>
      <div uk-form-custom>
        <input
          v-on:change="getUploadDirectory"
          id="upload-directory"
          type="file"
          webkitdirectory
        />
        <span id="upload-text" class="uk-link">{{ uploadDirectory }}</span>
      </div>
    </div>

    <div style="border: 1px dashed #e5e5e5; height: 316px; ">
      <pre
        id="upload-output"
        style="height: 296px; overflow:auto; overflow-y:scroll;"
      >
Select a folder and click the Upload button to continue.
      </pre>
    </div>
  </div>
</template>

<script>
const child_process = require("child_process");
const process = require("process");
const walk = require("fs-walk");
const path = require("path");
const fs = require("fs");
const os = require("os");
const archiver = require('archiver');
const admZip = require("adm-zip");
const temp = require("temp").track();

const settings = require("electron-settings");

const app = require("electron").remote.app;

// Disable default behavior of opening dropped file in window
document.addEventListener("drop", function(e) {
  e.preventDefault();
  e.stopPropagation();
});
document.addEventListener("dragover", function(e) {
  e.preventDefault();
  e.stopPropagation();
});


/**
 * @param {String} source
 * @param {String} out
 * @returns {Promise}
 */
function zipDirectory_old(source) {
  const archive = archiver('zip', { zlib: { level: 9 }});
  const temp_path = temp.mkdirSync("dicom-uploader");
  const out = path.join(temp_path, path.basename(source) + ".zip");
  const stream = fs.createWriteStream(out);
  console.log("Zipping:", source);
  console.log("Saving zip to: ", out);

  return new Promise((resolve, reject) => {
    archive
        .directory(source, false)
        .on('error', err => reject(err))
        .pipe(stream)
    ;

    stream.on('close', () => {
      console.log("Saved zip to: ", out);
      return resolve(out)
    } );
    archive.finalize();
  });
}
function zipDirectory(source) {
  const temp_path = temp.mkdirSync("dicom-uploader");
  const out = path.join(temp_path, path.basename(source) + ".zip");
  const file = new admZip();
  file.addLocalFolder(source);
  console.log("Zipping:", source);
  file.writeZip(out);
  console.log("Finished zip to: ", out);
  return out
}
export default {
  data() {
    return {
      xnathost: "",
      asperahost: "",
      inboxPath: "/data/intradb/inbox",
      project: "",
      uploadDirectory: "Drag or click to select a folder ...",
      imageSessions: [],
      uploading: false,
      status: "idle",
      // timestamp: Math.floor(Date.now()),
      errorMessages: [],
      attempt: 0
    };
  },
  computed: {
    statusIconComputed: function() {
      switch (this.status) {
        case "uploading":
          return "fa fa-spinner fa-pulse fa-fw";
        case "success":
          return "fa fa-thumbs-up green";
        case "warning":
          return "fa fa-exclamation-circle orange";
        case "error":
          return "fa fa-times-circle red";
        default:
          return "fa fa-cloud-upload";
      }
    }
  },
  mounted: function() {
    var xnatServers = settings.get("config.servers.xnat.list");
    var asperaServers = settings.get("config.servers.asp.list");
    var i = settings.get("config.servers.xnat.selected");
    var options = settings.get("options");

    this.xnathost = xnatServers[i].hostname.split("//")[1];
    this.asperahost = asperaServers[0].hostname;
    this.project = options.selectedProject;
    this.attempt = 0;
    // this.inboxPath = xnatServers[i].inbox
    console.log(this.xnathost + " + " + this.project);
    console.log("asp: " + this.asperahost);

    this.changeNextButton();
  },
  beforeDestroy: function() {
    var nextBtn = document.getElementById("next-btn");
    nextBtn.innerHTML = "Next";
    nextBtn.onclick = null;
    // TODO keep list of spawned processes and kill here
  },
  methods: {
    changeNextButton: function() {
      // Change the text and click action of Next to Upload
      var nextBtn = document.getElementById("next-btn");
      nextBtn.innerHTML = "Upload";
      nextBtn.onclick = this.startUpload.bind(null);
    },
    getUploadDirectory: function() {
      // Handle file dialog selection
      var uploads = document.getElementById("upload-directory").files;
      // this.uploadReady = uploads.length

      if (uploads.length > 0) {
        this.uploadDirectory = uploads[0].path;
        document.getElementById("upload-text").innerHTML = this.uploadDirectory;
      }
    },
    getDroppedDirectory: function(e) {
      console.log("file dropped");
      e.preventDefault();
      this.uploadDirectory = e.dataTransfer.files[0].path;
      // this.uploadReady = true
    },
    validOptions: async function() {
      console.log("Validating user options");
      var options = settings.get("options");
      var subject = options.subjectLabel;
      var session = options.sessionLabel;
      var uploadType = options.uploadType;
      var labelsFrom = options.labelsFrom;
      // Clear out imageSession queue in case of any previous failures
      var imageSession = [];
      // console.log(this)

      // We need a valid connection to destination server

      // Check that key pair was created
      var keypair = settings.get("config.keypair.generated");
      if (!keypair) {
        var msg = "You must set up an access key during server setup.";
        this.errorMessages.push(msg);
      }

      // A project must be selected
      if (!this.project) {
        var msg = "You must select a project on the options screen.";
        this.errorMessages.push(msg);
      }

      // The directory must be present and proper (isDirectory and hasDicom)
      if (fs.lstatSync(this.uploadDirectory).isDirectory()) {
        var hasDicom = await this.hasDicom();
        console.log("hasDicom: " + hasDicom);

        if (!hasDicom) {
          var msg = "This directory does not appear to contain DICOM files.";
          this.errorMessages.push(msg);
        }
      } else {
        // Not a directory
        var msg = "The uploader only accepts directories, no files.";
        this.errorMessages.push(msg);
      }

      // If labels are user defined, make sure they're set
      if (labelsFrom == "user") {
        if (!subject || !session) {
          var msg =
            "You selected 'User Defined' labels. You must input them on options screen.";
          this.errorMessages.push(msg);
        } else {
          // Only one session to upload if user defined labels,
          // still adding to queue for code uniformity
          var s = {};
          s.subjectLabel = subject;
          s.sessionLabel = session;
          s.directory = this.uploadDirectory;
          this.imageSessions.push(s);
        }
      }
      // If labels are from dicom, make sure they're present in headers
      if (labelsFrom == "dicom") {
        var labels = {};
        try {
          labels = await this.getDicomLabels(this.uploadDirectory);
          console.log("labels inside validOptions()");
          console.log(labels);
          var s = labels.subject;
          var e = labels.session;
        } catch (err) {
          console.log(err);
          var msg = "Could not get subject/session label from DICOM.";
          this.errorMessages.push(msg);
        }
        // Queue up session here if it's a single session upload
        if (uploadType == "single" && labels) {
          var s = {};
          s.subjectLabel = labels.subject;
          s.sessionLabel = labels.session;
          s.directory = this.uploadDirectory;
          this.imageSessions.push(s);
        }
      }

      var servers = settings.get("config.servers.xnat.list");
      var i = settings.get("config.servers.xnat.selected");
      var inboxPath = servers[i].inbox;
      // var inboxPath = '/data/intradb'

      console.log("inboxPath: " + this.inboxPath);
      console.log(this.errorMessages);
      // Clear output HTML
      var output = document.getElementById("upload-output");
      output.innerHTML = "";

      // Return true if there are no errors
      if (!this.errorMessages.length) {
        return true;
      }

      // Check for inbox here since we want to continue upload regardless
      if (inboxPath === "NO INBOX" || inboxPath === "INBOX ERROR") {
        var msg = "There does not appear to be an Inbox for this XNAT server.";
        this.errorMessages.push(msg);
        var msg =
          "Attempting to upload to /tmp directory on server. No image session will be created.";
        this.errorMessages.push(msg);
        this.inboxPath = "/tmp";
      }

      // Otherwise display them all and return false
      while (this.errorMessages.reverse().length > 0) {
        output.innerHTML += "-- " + this.errorMessages.pop() + "\n";
      }
      return false;
    },
    // updateNow: function() {
    //   this.now = new Date()
    // },
    hasDicom: function() {
      console.log("Checking directory for DICOM files");
      var _this = this;

      return new Promise(function(resolve, reject) {
        walk.filesSync(
          _this.uploadDirectory,
          (basedir, filename, stat, next) => {
            var filepath = path.join(basedir, filename);
            var f = fs.readFileSync(filepath);
            var byteArray = new Uint8Array(f);

            try {
              var dataSet = dicomParser.parseDicom(byteArray);
              resolve(true);
            } catch (e) {
              console.log(e);
              next();
            }
          },
          err => {
            console.log("end of walk.files() in hasDicom()");
            resolve(false);
          }
        );
      });
    },
    getDicomLabels: function(dir) {
      console.log("Getting Subject & Session labels from DICOM headers");
      // var files = []
      var labels = {
        subject: undefined,
        session: undefined
      };

      return new Promise((resolve, reject) => {
        walk.files(
          dir,
          (basedir, filename, stat, next) => {
            var filepath = path.join(basedir, filename);
            var f = fs.readFileSync(filepath);
            var byteArray = new Uint8Array(f);

            try {
              var dataSet = dicomParser.parseDicom(byteArray);
              labels.subject = dataSet.string("x00100010");
              labels.session = dataSet.string("x00100020");
            } catch (e) {
              console.log(e);
              next();
            }
            // Resolve when we've found labels
            if (
              typeof labels.subject != "undefined" &&
              typeof labels.session != "undefined"
            ) {
              // console.log("Found labels from DICOM: " + labels.subject + ' / ' + labels.session)
              resolve(labels);
            }
          },
          err => {
            console.log("end of walk.files() in getDicomLabels()");
            resolve(false);
          }
        );
      });
    },
    prepareSessions: async function() {
      // Create list of sessions to process based on
      // directory structure and dicom headers
      console.log("Getting session directories");
      var sessionDirectories = [];
      var dirListing = fs.readdirSync(this.uploadDirectory);
      this.imageSessions = [];

      for (var i = 0; i < dirListing.length; i++) {
        var d = path.join(this.uploadDirectory, dirListing[i]);
        if (fs.lstatSync(d).isDirectory()) {
          sessionDirectories.push(d);
        }
      }
      console.log("sessionDirectories: " + sessionDirectories);

      // Get labels for each session in directory
      for (var i = 0; i < sessionDirectories.length; i++) {
        var dir = sessionDirectories[i];
        var labels = await this.getDicomLabels(dir);
        console.log("labels:");
        console.log(labels);
        var s = {};
        s.directory = dir;
        s.subjectLabel = labels.subject;
        s.sessionLabel = labels.session;
        // console.log(s)
        this.imageSessions.push(s);
      }
      return new Promise((resolve, reject) => {
        resolve(true);
      });
    },
    startUpload: async function() {
      // Upload and start build process for sessions
      console.log("startUpload executed");
      // Check for any missing data
      var valid = await this.validOptions();
      if (!valid) {
        console.log("Invalid options");
        return;
      }
      console.log("Options all check out");

      if (settings.get("options.uploadType") == "multiple") {
        await this.prepareSessions();
      }

      // Start elapsed counter
      // this.uploadStart = new Date()
      // setInterval(this.updateNow, 1000)

      var btn = document.getElementById("next-btn");
      btn.setAttribute("disabled", "disabled");

      var xferClient = settings.get("config.xferClient");

      var keyPath = path.join(
        path.dirname(settings._getSettingsFilePath()),
        "ccf_id_rsa"
      );

      // TODO clean up production vs development
      var binDir
      if (process.env.NODE_ENV === "development") {
        binDir = path.join(process.cwd(), "bin");
        console.log("Setting binDir in DEV env");
      } else {
        binDir = path.join(__dirname, "..", "bin");
      }
        console.log("Setting binDir to:", binDir)

      // Set up options depending on upload client and platform
      // Only host and key should vary between client and platforms
      for (var i = 0; i < this.imageSessions.length; i++) {
        this.status = "uploading";

        var key = keyPath;
        var localLog = path.join(os.homedir(), "Desktop");

        if (xferClient == "rsync") {
          console.log("Launching rsync process");
          var host = this.xnathost;
          var script = path.join(binDir, "rsync", "rsync.sh");
        } else if (xferClient == "aspera") {
          console.log("Launching aspera process");
          var host = this.asperahost;

          console.log("platform: " + process.platform);
          if (process.platform === "win32") {
            var script = path.join(binDir, "aspera", "aspera.cmd");
            script = script.replace(/ /g, "^ ");
            key = '"' + keyPath + '"';
          } else {
            var script = path.join(binDir, "aspera", "aspera.sh");
          }
        }

        var options = [
          host,
          this.project,
          this.imageSessions[i].sessionLabel,
          await zipDirectory_old(this.imageSessions[i].directory),
          this.inboxPath,
          key,
          localLog,
          process.platform
          // this.timestamp
        ];

        this.attempt = 0;
        await this.runUploadScript(
          script,
          options,
          binDir,
          this.imageSessions[i]
        );
      }
    },
    runUploadScript: async function(script, options, binDir, imageSession) {
      this.attempt += 1;
      // maxAttempts = 5

      var output = document.getElementById("upload-output");

      // Keep the div scrolled to bottom as in a terminal window
      function scrollToBottom() {
        // this will be true if the scrollbar is within 100px from the bottom
        var isScrolledToBottom =
          output.scrollHeight - output.clientHeight <= output.scrollTop + 100;

        // set the scrollTop of the div to the bottom
        if (isScrolledToBottom) output.scrollTop = output.scrollHeight + 20;
      }

      console.log("launching: " + script);
      console.log("Script options: \n" + options);

      var datetime = require("node-datetime");
      var dt = datetime.create().format("Y-m-d H:M:S");

      output.innerHTML +=
        "\nUpload attempt " +
        this.attempt +
        " started for " +
        imageSession.sessionLabel +
        " on " +
        dt +
        "\n";
      scrollToBottom();

      var params = { cwd: binDir };
      if (process.platform === "win32") {
        params.shell = true;
      }

      return new Promise((resolve, reject) => {
        try {
          var client = child_process.spawn(script, options, params);
            console.log('RUNNING::', script, options, params)

          // client.stdout.on('data', (data) => {
          //   output.innerHTML += data
          //   scrollToBottom()
          // })

          client.stderr.on("data", data => {
            console.log("ERROR: " + data);
            output.innerHTML += "\n" + data;
            output.innerHTML +=
              "++ ERROR uploading files for " +
              imageSession.sessionLabel +
              " ++\n";
            scrollToBottom();
            // TODO if NODE_ENV=win32, remove \r
            this.uploading = false;
            this.status = "error";
          });

          client.on("close", code => {
            ////////
            // code = 2
            ////////

            console.log("exit code: " + code);
            this.uploading = false;

            // output.innerHTML += "\nUpload finished in " + _this.elapsed

            if (code > 0) {
              if (this.attempt < 20) {
                console.log("retry upload, attempt " + this.attempt);
                output.innerHTML += "Retrying upload in 3 seconds ...\n";
                scrollToBottom();

                setTimeout(() => {
                  this.runUploadScript(script, options, binDir, imageSession);
                }, 3000);
              }
              // output.innerHTML += '\nExit code: ' + code
              this.status = "error";
              return;
            } else {
              output.innerHTML += "-- Upload successful --\n";
              this.status = "success";
            }

            this.buildSession(imageSession);
            resolve(true);
          });
        } catch (e) {
          this.uploading = false;
          this.status = "error";
          output.innerHTML +=
            "\n++ ERROR uploading files for " +
            imageSession.sessionLabel +
            " ++\n" +
            e +
            "\n";
          scrollToBottom();
          resolve(false);
          // return
        }
      });
      // var Tail = require('tail').Tail
      // var opts = {separator: /[\r]{0,1}\n/}
      // var ascpLog = path.join(options[5], 'aspera-scp-transfer.log')
      // var tail = new Tail(ascpLog, opts)

      // tail.on("line", function(data) {
      //   output.innerHTML += data + '\n'
      //   scrollToBottom()
      // })

      // tail.on("error", function(error) {
      //   console.log('ERROR:', error)
      // })
    },
    buildSession: function(imageSession) {
      // Get host and auth from app settings
      var servers = settings.get("config.servers.xnat.list");
      var i = settings.get("config.servers.xnat.selected");
      var xnatHost = servers[i].hostname;
      var auth = {
        username: servers[i].username,
        password: app.decrypt(servers[i].key)
      };
      // var inboxPath = servers[i].inbox
      console.log("imageSession.directory: " + imageSession.directory);
      // var directories = imageSession.directory.split('/')
      // var lastDirectory = directories[directories.length-1]
      // var lastDirectory = path.basename(path.dirname(imageSession.directory))
      var lastDirectory = imageSession.directory.split(path.sep).pop();
      console.log("topDirectory: " + lastDirectory);

      var options = settings.get("options");
      var project = options.selectedProject;
      var subject = imageSession.subjectLabel;
      var session = imageSession.sessionLabel;

      // HARDCODING
      this.inboxPath = "/data/intradb/inbox";

      var uri = "/data/services/import?import-handler=inbox";
      uri += "&rename=true&prevent_anon=true&prevent_auto_commit=true";
      uri += "&SOURCE=inbox&autoArchive=AutoArchive";
      uri += "&PROJECT_ID=" + project;
      uri += "&SUBJECT_ID=" + subject;
      uri += "&EXPT_LABEL=" + session;
      // uri += "&path=" + this.inboxPath + '/' + project + '/' + this.timestamp + '/' + lastDirectory
      uri +=
        "&path=" +
        this.inboxPath +
        "/" +
        project +
        "/" +
        session +
        "/" +
        lastDirectory;

      var output = document.getElementById("upload-output");
      console.log("Attempting POST:\n" + uri);
      output.innerHTML +=
        "\nAttempting to build session " + session + " on " + xnatHost + "\n";

      app
        .httpPost(xnatHost, uri, auth)
        .then(response => {
          console.log(response);
          output.innerHTML +=
            "-- Request for session build successful (" + session + ") --\n";
          output.innerHTML +=
            "-- The session should currently be in the pre-archive on \n";
          output.innerHTML +=
            xnatHost + " and will take some time to archive.\n";
          if (settings.get("options.uploadType") == "single") {
            output.innerHTML +=
              "\nFeel free to start another upload or close the application at this point.";
          }
          this.status = "success";

          // Re-enable Upload button
          var btn = document.getElementById("next-btn");
          btn.removeAttribute("disabled");
        })
        .catch(e => {
          console.log(e);
          output.innerHTML +=
            "\n++ ERROR building XNAT image session (" +
            session +
            ") on " +
            xnatHost +
            " ++\n" +
            e +
            "\n";
          this.status = "warning";
        });

      // Clear out user defined labels once upload is underway
      settings.set("options.subjectLabel", "");
      settings.set("options.sessionLabel", "");
    }
  }
};
</script>

<style>
pre {
  border: none;
}
.red {
  color: red;
}
.orange {
  color: orange;
}
.green {
  color: green;
}
.statusIcon {
  position: relative;
  top: 2px;
}
</style>
