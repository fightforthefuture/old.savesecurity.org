window.components = window.components || {};
window.components.forms = function (doc, win) {
  /**
   * Retrieves form data from Action Network API, then submits entry
   * @param {object} doc - Document object
   * @param {object} win - Window object
   * */
  "use strict";

  var
    body = doc.getElementsByTagName('body')[0],
    submitButton = body.querySelector('[type="submit"]'),
    submitted = doc.createElement('div'),
    countryLabel = doc.querySelector('[for="select-country"]'),
    countrySelect = doc.getElementById('select-country'),
    countryInput = doc.getElementById('hidden-country'),
    commitmentForm = doc.forms[0];

  submitted.classList.add('submitted');
  submitted.innerHTML = '<div class="circle-spinner">&nbsp;</div>';

  function updateZIPPlaceholder() {
    /**
     * Updates placeholder on ZIP/Post Code field to be appropriate for country
     * selected
     * */
    var
      ZIPLabel = doc.getElementById('form-zip_code');

    if (countrySelect.value !== 'US') {
      ZIPLabel.setAttribute('placeholder', 'Post code');
    } else {
      ZIPLabel.setAttribute('placeholder', 'ZIP');
    }
  }

  function toggleCountryField() {
    /**
     * Hides the label and shows the select when someone changes their signature
     * country.
     * */

    countryInput.remove();
    countrySelect.setAttribute('name', 'answer[country]');
    countrySelect.classList.add('visible');
    countryLabel.classList.add('hidden');
  }

  function removeForm() {
    commitmentForm.setAttribute('style', 'height: ' + commitmentForm.clientHeight + 'px;');
    win.setTimeout(function(){
      commitmentForm.setAttribute('style', 'height: 0;');
    }, 20)
  }

  function handleSigningError(e) {
    /**
     * Figures out what to say at just the right moment
     * @param {event|XMLHttpRequest} e - Might be an event, might be a response
     * from an XMLHttpRequest
     * */

    var
      errorMessage = doc.createElement('h2'),
      errorMessageInfo = doc.createElement('p');

    commitmentForm.removeAttribute('disabled');
    submitted.remove();
    errorMessage.textContent = 'Something went wrong';
    if (e.type) {
      errorMessageInfo.textContent = 'There seems to be a problem somewhere in between your computer and our server. Might not be a bad idea to give it another try.';
    } else if (e.status) {
      errorMessageInfo.textContent = '(the nerdy info is that the server returned a status of "' + e.status + '" and said "' + e.statusText + '".)'
    } else {
      errorMessageInfo.textContent = 'this seems to be a weird error. the nerds have been alerted.';
    }

    win.modals.generateModal([errorMessage, errorMessageInfo]);

    submitted.remove();
    submitButton.removeAttribute('disabled');
  }

  function handleSigningSuccess() {
    /**
     * Figures out what to say at just the right moment
     * @param {event|XMLHttpRequest} e - Might be an event, might be a response
     * from an XMLHttpRequest
     * */

    var
      modalContent = doc.createElement('div'),
      share = doc.getElementsByClassName('share')[0];

    console.log('share:' ,share);

    share.classList.add('visible');
    modalContent.innerHTML = '<h2>Thanks for signing</h2>\n<p>Now, share this page to spread the word.</p><ul class="share inline visible">\n'+share.innerHTML+'</ul><p><small>…or, <a href="https://donate.fightforthefuture.org/?amount=5&frequency=just-once">chip in $5</a> to help us spread the message.</small></p>';

    win.modals.generateModal([modalContent]);
    removeForm();

    document.querySelector('.modal-content button.facebook').addEventListener('click', FreeProgress.share.bind(FreeProgress));
    document.querySelector('.modal-content button.google').addEventListener('click', googlePlus);
    document.querySelector('.modal-content button.twitter').addEventListener('click', FreeProgress.tweet.bind(FreeProgress));
  }

  function submitForm(event) {
    /**
     * Submits the form to ActionNetwork.
     * @param {event} event - Form submission event
     * */

    event.preventDefault();

    var
      commitmentStatus = new XMLHttpRequest();

    commitmentForm.setAttribute('disabled', true);
    submitted.classList.add('submitted');
    submitButton.setAttribute('disabled', true);
    commitmentForm.appendChild(submitted);

    function compilePayload() {
      /**
       * Compiles the form data into a JSON payload for Ajax submission
       * @return {object} petitionFormData - just the info the API needs
       * */

      /**
       * Compiles the form data into a JSON payload for Ajax submission
       * @return {object} petitionFormData - just the info the API needs
       * */
      var tags = ['encryption'];
      if (util.getReferrerTag())
        tags.push(util.getReferrerTag());

      var formData = new FormData();
      formData.append('guard', '');
      formData.append('hp_enabled', true);
      formData.append('org', 'fftf');
      formData.append('tag', window.location.pathname);
      formData.append('an_tags', JSON.stringify(tags));
      formData.append('an_petition', doc.getElementById('petition-form').action.replace('/signatures', ''));

      formData.append('member[email]', doc.getElementById('form-email').value);
      formData.append('member[postcode]', doc.getElementById('form-zip_code').value);
      formData.append('member[country]', countrySelect.value);

      if (doc.getElementById('form-street_address')) {
        formData.append('member[street_address]', doc.getElementById('form-street_address').value);
      }

      if (doc.getElementById('form-first_name')) {
        formData.append('member[first_name]', doc.getElementById('form-first_name').value);
      }

      if (doc.getElementById('form-comments')) {
        formData.append('action_comment', doc.getElementById('form-comments').value);
      }

      return formData;

      /*
      var
        petitionFormData = {
          identifier: 'dad151da-e162-4ec5-8679-655bfcb2d03f',
          website: win.location.origin,
          tags: JSON.parse(doc.querySelector('[name="subscription[tag_list]"]').value),
          noOptIn: false,
          name: doc.getElementById('form-first_name').value,
          email: doc.getElementById('form-email').value,
          ZIP: doc.getElementById('form-zip_code').value,
          country: countrySelect.value,
          comments: doc.getElementById('form-comments').value
        };

      return JSON.stringify(petitionFormData);
      */
    }

    function loadSignatureResponse() {
      /**
       * Does the thing after we get a response from the API server
       * */

      if (commitmentStatus.status >= 200 && commitmentStatus.status < 400) {
        handleSigningSuccess();
      } else {
        handleSigningError(commitmentStatus);
      }
    }

    commitmentStatus.open('POST', 'https://queue.fightforthefuture.org/action', true);
    // commitmentStatus.open('POST', 'http://localhost:9001/action', true);
    commitmentStatus.addEventListener('error', handleSigningError);
    commitmentStatus.addEventListener('load', loadSignatureResponse);
    commitmentStatus.send(compilePayload());
  }

  function addEventListeners() {
    /**
     * Attaches all the listeners all the places
     * */
    countryLabel.addEventListener('click', toggleCountryField);
    countrySelect.addEventListener('change', updateZIPPlaceholder);
    commitmentForm.addEventListener('submit', submitForm);
  }

  function init() {
    addEventListeners();
  }

  init();
  // setTimeout(function() { handleSigningSuccess() }, 500); // JL DEBUG ~
};
