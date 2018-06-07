(function($) {
  "use strict";

  //Search
  //get all test authors
  $.get('api/tests/authors', function(authors) {
    authors.forEach(function(author) {
      $('#selectAuthor').append('<option>' + author + '</option>');
    });
  });
  //get all test subjects
  $.get('api/tests/subjects', function(subjects) {
    subjects.forEach(function(subject) {
      $('#selectSubject').append('<option>' + subject + '</option>');
    });
  });
  //get all test configuration
  $.get('api/tests/configurations', function(configurations) {
    configurations.forEach(function(config) {
      $('#selectConfig').append('<option value="' + config + '">Add a filter on ' + config + '</option>');
    });
  });

  // search
  $('#form-search').change(function() {
    //create the body request
    var bodyRequest = {
      '$and': []
    };
    //add the author to the body request
    if($('#selectAuthor').val() !== 'default') {
      bodyRequest.author = $('#selectAuthor').val();
    }
    //add the test subject to the body request
    if($('#selectSubject').val() !== 'default') {
      bodyRequest.type = $('#selectSubject').val();
    }
    //add the date to the body request
    if($('#inputDate').val() !== '') {
      bodyRequest.date = $('#inputDate').val();
    }
    //add the configuration to the body request
    $('.inputConfig').each(function() {
      if($(this).val() !== '') {
        bodyRequest['$and'].push({
          "configuration": {
            "$elemMatch": {
              "name": $(this).closest('.form-group').find('label').html(),
              "value": $(this).val()
            }
          }
        });
      }
    });

    //execute the search each time the box search content change
    search(bodyRequest, 1);
  });

  $('#selectSubject').change(function() {
    if($('#selectSubject').val() !== 'default') {
      //select only the configuration of the test subject
      $.get('api/tests/configurations/' + $('#selectSubject').val(), function(configurations) {
        $('#selectConfig').html('<option value="default">Click here to add filters</option>');
        configurations.forEach(function(config) {
          $('#selectConfig').append('<option value="' + config + '">Add a filter on ' + config + '</option>');
        });
      });
    } else {
      $.get('api/tests/configurations', function(configurations) {
        $('#selectConfig').html('<option value="default">Click here to add filters</option>');
        configurations.forEach(function(config) {
          $('#selectConfig').append('<option value="' + config + '">Add a filter on ' + config + '</option>');
        });
      });
    }

    //delete existing configuration
    $('.config-group').each(function() {
      $(this).remove();
    })
    selectedConfig = [];
  })

  $('#form-search').submit(function(e) {
    e.preventDefault();
  })

  //add input when a new configuration is selected
  var selectedConfig = [];
  $('#selectConfig').change(function() {
    if($('#selectConfig').val() !== 'default' && !selectedConfig.includes($('#selectConfig').val())) {
      selectedConfig.push($('#selectConfig').val());
      $('#form-search').append('' +
      '<div class="form-group config-group">' +
        '<label class="labelConfig">' + $('#selectConfig').val() + '</label>' +
        '<div class="row">' +
          '<div class="col">' +
            '<select class="form-control inputConfig">' +
              '<option></option>' +
            '</select>' +
          '</div>' +
          '<div class="col-2">' +
            '<button type="button" class="btn btn-warning deleteConfig" id="deleteConfig"><i class="fa fa-times" aria-hidden="true"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>'
      );
      $.get('/api/tests/options/' + $('#selectConfig').val(), function(options) {
        options.forEach(function(option) {
          $('.inputConfig:last').append('<option>' + option + '</option>')
        });
        $('#selectConfig').val('default');
      });
    } else {
      $('#selectConfig').val('default');
    }
  });

  //delete config input
  $('#form-search').on('click', '.deleteConfig', function() {
    //remove config from the array
    selectedConfig.splice(selectedConfig.indexOf($(this).closest('.form-group').find('label').html()), 1);
    //remove config input from the page
    $(this).closest('.form-group').remove();
    $('#form-search').trigger('change');
  })

  function search(body, page) {
    var resultPerPage = 30;
    $.post('api/tests/page/' + page + '/' + resultPerPage, body, function(tests) {
      var matchedTests = [];
      $('#tests-grid').html('');
      if(isConnected() && isMaster()) {
        //if the user is Master
        tests.forEach(function(test) {
          matchedTests.push(test['_id']);
          $('#tests-grid').append('<div class="col-sm-4"><div class="card mb-3" id="' + test['_id'] + '">' +
            '<div class="card-header">'+ test.type + ' <span class="testNumber"></span></div>' +
            '<div class="card-body tests" id="body' + test['_id'] + '">' +
              '<span class="key">Author: </span><span class="value">' + test.author + '</span><br>' +
              '<span class="key">Date: </span><span class="value">' + test.date + '</span><br>' +
            '</div>' +
            '<div class="card-footer small text-muted" id="footer' + test['_id'] + '"><div id="info-footer">id: ' + test['_id'] + '<br> last modification: ' + new Date(test.lastModification).toLocaleDateString() + '</div>' +
              '<div class="button-footer" id="button-footer' + test['_id'] + '">' +
                '<button type="button" class="btn btn-danger admin-user" id="deleteTest"><i class="fa fa-trash" aria-hidden="true"></i></button>' +
                '<button type="button" class="btn btn-info admin-user" id="editTest" data-toggle="modal" data-target="#modalEdit"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>' +
                '<a class="btn btn-success download-button" href="/api/download/id/' + test['_id'] + '"><i class="fa fa-download" aria-hidden="true"></i></a>' +
              '</div>' +
            '</div>' +
          '</div></div>');

          test.configuration.forEach(function(config) {
            $('#body'+test['_id']).append('<li class="config"><span class="configName">' + config.name + ':</span><span class="value"> ' + config.value + '</span></li>');
          });
        });
      } else if (isConnected()) {
        //if the user is connected but not a master --> can only modify his own tests
        const username = getUserName();
        tests.forEach(function(test) {
          matchedTests.push(test['_id']);
          $('#tests-grid').append('<div class="col-sm-4"><div class="card mb-3" id="' + test['_id'] + '">' +
            '<div class="card-header">'+ test.type + ' <span class="testNumber"></span></div>' +
            '<div class="card-body tests" id="body' + test['_id'] + '">' +
              '<span class="key">Author: </span><span class="value">' + test.author + '</span><br>' +
              '<span class="key">Date: </span><span class="value">' + test.date + '</span><br>' +
            '</div>' +
            '<div class="card-footer small text-muted"><div id="info-footer">id: ' + test['_id'] + '<br> last modification: ' + new Date(test.lastModification).toLocaleDateString() + '</div>' +
              '<div class="button-footer" id="button-footer' + test['_id'] + '">' +
                '<a class="btn btn-success download-button" href="/api/download/id/' + test['_id'] + '"><i class="fa fa-download" aria-hidden="true"></i></a>' +
              '</div>' +
            '</div>' +
          '</div></div>');

          test.configuration.forEach(function(config) {
            $('#body'+test['_id']).append('<li class="config"><span class="configName">' + config.name + ':</span><span class="value"> ' + config.value + '</span></li>');
          });

          if(username === test.author) {
            $('#button-footer'+test['_id']).html('' +
            '<button type="button" class="btn btn-danger admin-user" id="deleteTest"><i class="fa fa-trash" aria-hidden="true"></i></button>' +
            '<button type="button" class="btn btn-info admin-user" id="editTest" data-toggle="modal" data-target="#modalEdit"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>' +
            '<a class="btn btn-success download-button" href="/api/download/id/' + test['_id'] + '"><i class="fa fa-download" aria-hidden="true"></i></a>');
          }
        });
      } else {
        //if the user isn't logged
        tests.forEach(function(test) {
          matchedTests.push(test['_id']);
          $('#tests-grid').append('<div class="col-sm-4"><div class="card mb-3" id="' + test['_id'] + '">' +
            '<div class="card-header">'+ test.type + ' <span class="testNumber"></span></div>' +
            '<div class="card-body tests" id="body' + test['_id'] + '">' +
              '<span class="key">Author: </span><span class="value">' + test.author + '</span><br>' +
              '<span class="key">Date: </span><span class="value">' + test.date + '</span><br>' +
            '</div>' +
            '<div class="card-footer small text-muted" id="footer' + test['_id'] + '"><div id="info-footer">id: ' + test['_id'] + '<br> last modification: ' + new Date(test.lastModification).toLocaleDateString() + '</div>' +
              '<div class="button-footer" id="button-footer' + test['_id'] + '">' +
                '<a class="btn btn-success download-button" href="/api/download/id/' + test['_id'] + '"><i class="fa fa-download" aria-hidden="true"></i></a>' +
              '</div>' +
            '</div>' +
          '</div></div>');

          test.configuration.forEach(function(config) {
            $('#body'+test['_id']).append('<li class="config"><span class="configName">' + config.name + ':</span><span class="value"> ' + config.value + '</span></li>');
          });
        });
      }

      // display number of results
      $.post('api/tests', body, function(totalTests) {
        if(totalTests.length > 1) {
          $('#header-result').html('' +
          '<div class="card mb-3">' +
            '<div class="card-header">' +
              '<div class="row">' +
                '<div class="col-6">' +
                  '<h5>' + totalTests.length + ' tests found</h5>' +
                  '<span id="itemOnPage"></span>' +
                '</div>' +
                '<div class="col-6">'+
                  '<button id="buttonDownloadAll" class="btn btn-success"><i class="fa fa-download" aria-hidden="true"></i> Download All</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>');
        } else if (totalTests.length === 1) {
          $('#header-result').html('' +
          '<div class="card mb-3">' +
            '<div class="card-header">' +
              '<div class="row">' +
                '<div class="col-6">' +
                  '<h5>' + totalTests.length + ' test found</h5>' +
                '</div>' +
                '<div class="col-6">'+
                  '<button id="buttonDownloadAll" class="btn btn-success"><i class="fa fa-download" aria-hidden="true"></i> Download All</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>');
        } else {
          $('#header-result').html('' +
          '<div class="card mb-3">' +
            '<div class="card-header">' +
              '<div class="row">' +
                '<div class="col-6">' +
                  '<h5>No test found</h5>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>');
        }

        // "Download All" button handler
        $('#buttonDownloadAll').click(function() {
          $("#waitDialog").modal('show');
          $('#waitDialog').modal({
            backdrop: 'static',
            keyboard: false
          });
          $.post('api/download/multiple', {ids: matchedTests}, function(data) {
            window.location.href = 'api/download/id/multiple';
            var timer = window.setInterval(function() {
              clearInterval(timer);
              $("#waitDialog").modal('hide');
            }, 1000);
          });
        });

        // navigation
        var numberOfPages = Math.ceil(totalTests.length / resultPerPage);
        var from = resultPerPage * page - resultPerPage + 1;
        var to = resultPerPage * page;
        if (to < totalTests.length) {
          $('#itemOnPage').html(from + ' - ' + to + ' (Page ' + page + '/' + numberOfPages + ')');
        } else {
          $('#itemOnPage').html(from + ' - ' + totalTests.length + ' (Page ' + page + '/' + numberOfPages + ')');
        }

        $('.testNumber').each(function(idx) {
          $(this).html('#' + (from+idx));
        });


        $('.pagination').html('');
        if (numberOfPages > 1) {
          for (var i=1; i<=numberOfPages; i++) {
            $('.pagination').append('<li class="page-item" id="page-item' + i + '"><a class="page-link">' + i + '</a></li>');
          }
        }
        $('#page-item' + page).addClass('active');

        $('#pagination').on('click', '.page-link', function() {
          //get the filters
          var bodyRequest = {
            '$and': []
          };
          if($('#selectAuthor').val() !== 'default') {
            bodyRequest.author = $('#selectAuthor').val();
          }
          if($('#selectSubject').val() !== 'default') {
            bodyRequest.type = $('#selectSubject').val();
          }
          if($('#inputDate').val() !== '') {
            bodyRequest.date = $('#inputDate').val();
          }
          $('.inputConfig').each(function() {
            if($(this).val() !== '') {
              bodyRequest['$and'].push({
                "configuration": {
                  "$elemMatch": {
                    "name": $(this).closest('.form-group').find('label').html(),
                    "value": $(this).val()
                  }
                }
              });
            }
          });
          if (bodyRequest['$and'].length === 0) {
            delete bodyRequest['$and'];
          }

          //redirect to the page
          if (bodyRequest['$and'] || bodyRequest.author || bodyRequest.type || bodyRequest.date) {
            window.location.href = '?page=' + $(this).html() + '&query=' + JSON.stringify(bodyRequest);
          } else {
            window.location.href = '?page=' + $(this).html();
          }
        });
      });
    });
  }

  // Delete a test
  $('#tests-grid').on('click', '#deleteTest', function() {
    var r = confirm('Please confirm that you want to delete this test.');
    if(r === true) {
      $.ajax({
        method: 'DELETE',
        url: 'api/tests/id/' + $(this).parent().parent().parent().attr('id'),
        headers: {"Authorization": "Basic " + btoa(getAuthentification())},
        success: function() {
          location.reload();
        }
      });
    }
  });

  // Edit a test
  $('#tests-grid').on('click', '#editTest', function() {
    $.get('api/tests/id/' + $(this).parent().parent().parent().attr('id'), function(test) {
      $('.modal-body').html('' +
      '<div class="form-group">' +
        '<label for="inputDateEdit">Date</label>' +
        '<input type="date" id="inputDateEdit" max="2100-12-31" min="2010-01-01" class="form-control" value="' + test.date + '" required>' +
      '</div>'
      );
      test.configuration.forEach(function(config) {
        $('.modal-body').append('' +
        '<div class="form-group">' +
          '<label>' + config.name + '</label>' +
          '<select class="form-control selectConfigEdit ' + config.name + '">' +
            '<option>' + config.value + '</option>' +
          '</select>' +
        '</div>'
        );
        $.get('api/test-subjects/options/' + test.type + '/' + config.name, function(options) {
          if(options.length > 0) {
            options.forEach(function(option, idx, array) {
              if(option !== $('.selectConfigEdit.' + config.name).val()) {
                $('.selectConfigEdit.' + config.name).append('<option>' + option + '</option>');
              }
              if(idx === array.length-1) {
                $('.selectConfigEdit.' + config.name).append('<option>Other</option>');
              }
            });
          } else {
            $('.selectConfigEdit.' + config.name).append('<option>Other</option>');
          }
        });
      });
      $('.modal-footer').html('' +
        '<input type="submit" value="Apply" class="btn btn-info" id="submit-edit">' +
        '<button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>'
      );
      $('.form-edit').attr('id', test['_id']);
    });
  });

  // add an input if the user select "Other" on a configuration
  $('#modalEdit').on('change', '.selectConfigEdit', function() {
    if($(this).val() === 'Other') {
      $(this).closest('.form-group').append('<input type="text" class="form-control inputConfigEdit" required>');
    } else {
      $(this).closest('.form-group').find('.inputConfigEdit').remove();
    }
  });

  $('.form-edit').submit(function(e) {
    e.preventDefault();
    var r = confirm('Please confirm that you want to modify this test.');
    if(r === true) {
      var okayToPush = true;
      var test = {
        date: $('#inputDateEdit').val(),
        configuration: [],
      };
      $('.selectConfigEdit').each(function() {
        if($(this).val() !== 'Other') {
          test.configuration.push({
            name: $(this).prev().html(),
            value: $(this).val().trim()
          });
        }
      });
      $('.inputConfigEdit').each(function() {
        if($(this).val().trim() === "") {
          okayToPush = false;
        } else {
          test.configuration.push({
            name: $(this).prev().prev().html(),
            value: $(this).val().trim().toLowerCase().replace(/\s+/g, ' ')
          });
        }
      });

      if(okayToPush === true) {
        $.ajax({
          method: 'POST',
          url: 'api/tests/id/' + $('.form-edit').attr('id'),
          headers: {"Authorization": "Basic " + btoa(getAuthentification())},
          data: test,
          success: function() {
          location.reload();
          }
        });
      } else {
        showModal('Error', 'Your test was not added because you left an empty field.');
      }
    }
  });

  //save filters
  $('#buttonSaveFilters').click(function() {
    var filter = {
      user: getUserName(),
      configuration: []
    };
    if($('#inputDate').val() !== '') {
      filter.date = $('#inputDate').val();
    }
    if($('#selectSubject').val() !== 'default') {
      filter.testSubjectName = $('#selectSubject').val();
    }
    if($('#selectAuthor').val() !== 'default') {
      filter.testAuthor = $('#selectAuthor').val();
    }

    $('.config-group').each(function() {
      if($(this).find('.inputConfig').val() !== '') {
        filter.configuration.push({
          name: $(this).find('.labelConfig').html(),
          value: $(this).find('.inputConfig').val()
        });
      }
    });

    if(isConnected()) {
      if(filter.configuration.length > 0 || filter.date || filter.testAuthor || filter.testSubjectName) {
        // check if filter already exist
        $.get('api/filters', function(savedFilters) {
          var alreadyExist = false;
          savedFilters.forEach(function(savedFilter) {
            if((savedFilter.user === filter.user) && (savedFilter.testSubjectName === filter.testSubjectName) && (savedFilter.testAuthor === filter.testAuthor) && (savedFilter.date === filter.date) && configurationsAreTheSame(savedFilter.configuration, filter.configuration)) {
              alreadyExist = true;
            }
          });
          if (alreadyExist === false) {
            $.ajax({
              method: 'POST',
              url: 'api/filters',
              headers: {"Authorization": "Basic " + btoa(getAuthentification())},
              data: filter,
              success: function(data) {
                console.log(data);
                if(data.name === 'Success') {
                  showModal('Success', 'Your search has been saved !<br><br>You can now find it in "My Searches" to reuse it or to share it.');
                }
              }
            });
          } else {
            showModal('Error','You already saved this search !<br><br>Check the page "My Searches" to manage them.');
          }
        });


      } else {
        showModal('Error', 'Add some filters to your search before saving it.');
      }
    } else {
      showModal('Error', 'Please log in to save your search !');
    }
  });

  //use filter if present in URL
  if(getUrlParameter('filter')) {
    $.get('api/filters/id/' + getUrlParameter('filter'), function(filter) {
      if (filter['_id']) {
        if (filter.date) {
          $('#inputDate').val(filter.date);
        }
        if (filter.testSubjectName) {
          $('#selectSubject').val(filter.testSubjectName);
        }
        if (filter.testAuthor) {
          $('#selectAuthor').val(filter.testAuthor);
        }
        if (filter.configuration.length > 0) {
          filter.configuration.forEach(function(config) {
            selectedConfig.push(config.name);
            $('#form-search').append('' +
            '<div class="form-group config-group">' +
              '<label class="labelConfig">' + config.name + '</label>' +
              '<div class="row">' +
                '<div class="col">' +
                  '<select class="form-control inputConfig ' + config.name + '">' +
                    '<option></option>' +
                  '</select>' +
                '</div>' +
                '<div class="col-2">' +
                  '<button type="button" class="btn btn-warning deleteConfig" id="deleteConfig"><i class="fa fa-times" aria-hidden="true"></i></button>' +
                '</div>' +
              '</div>' +
            '</div>'
            );
            $.get('/api/tests/options/' + config.name, function(options) {
              options.forEach(function(option) {
                $('.inputConfig.' + config.name).append('<option>' + option + '</option>');
              });
              $('.inputConfig.' + config.name).val(config.value);
            });
          });
        }
        setTimeout(function() {
          $('#form-search').trigger('change');
        }, 100);
      } else {
        console.log('Error with the filter ID in params.');
        console.log(filter);
      }
    });
  }

  // Search without filter at the loading of the page
  if(getUrlParameter('page') && getUrlParameter('query')) {
    var page = getUrlParameter('page');
    var query = JSON.parse(getUrlParameter('query'));
    setTimeout(function() {
      if (query.author) {
        $('#selectAuthor').val(query.author);
      }
      if (query.date) {
        $('#inputDate').val(query.date);
      }
      if (query.type) {
        $('#selectSubject').val(query.type);
      }
      if (query['$and']) {
        query['$and'].forEach(function(specificFilter) {
          selectedConfig.push(specificFilter.configuration['$elemMatch'].name);
          $('#form-search').append('' +
          '<div class="form-group config-group">' +
            '<label class="labelConfig">' + specificFilter.configuration['$elemMatch'].name + '</label>' +
            '<div class="row">' +
              '<div class="col">' +
                '<select class="form-control inputConfig" id="inputConfig' + specificFilter.configuration['$elemMatch'].name + '">' +
                  '<option></option>' +
                '</select>' +
              '</div>' +
              '<div class="col-2">' +
                '<button type="button" class="btn btn-warning deleteConfig" id="deleteConfig"><i class="fa fa-times" aria-hidden="true"></i></button>' +
              '</div>' +
            '</div>' +
          '</div>'
          );
          $.get('/api/tests/options/' + specificFilter.configuration['$elemMatch'].name, function(options) {
            options.forEach(function(option) {
              $('#inputConfig' + specificFilter.configuration['$elemMatch'].name).append('<option>' + option + '</option>');
            });
            $('#inputConfig' + specificFilter.configuration['$elemMatch'].name).val(specificFilter.configuration['$elemMatch'].value);
          });
        });
      }
    }, 100);

    search(query, page);
  } else if (getUrlParameter('page')) {
    var page = getUrlParameter('page');
    search({}, page);
  } else {
    search({}, 1);
  }

  // -------------------------- Functions -------------------------- //

  function isConnected() {
    var res = false;
    $.ajax({
      type: 'GET',
      url: 'api/user/profile',
      async: false,
      success: function(user) {
        res = !user.error;
      }
    });
    return res;
  }

  function hasWritePermission() {
    var res = false;
    $.ajax({
      type: 'GET',
      url: 'api/user/profile',
      async: false,
      success: function(user) {
        res = user['write_permission'];
      }
    });
    return res;
  }

  function isMaster() {
    var res = false;
    $.ajax({
      type: 'GET',
      url: 'api/user/profile',
      async: false,
      success: function(user) {
        res = user.master;
      }
    });
    return res;
  }

  function getUserName() {
    var res;
    $.ajax({
      type: 'GET',
      url: 'api/user/profile',
      async: false,
      success: function(user) {
        res = user.name;
      }
    });
    return res;
  }

  function getMasterList() {
    var res = "";
    $.ajax({
      type: 'GET',
      url: 'api/user/master',
      async: false,
      success: function(masters) {
        masters.forEach(function(master) {
          res += master.firstname + ' ' + master.lastname + ': ' + master.email + '\n';
        });
      }
    });
    return res;
  }

  function getAuthentification() {
    var res;
    $.ajax({
      type: 'GET',
      url: 'api/user/profile',
      async: false,
      success: function(user) {
        res = user.email + ':' + user.token;
      }
    });
    return res;
  }

  function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  }

  function configurationsAreTheSame(firstConfigArray, secondConfigArray) {
    if (firstConfigArray.length === secondConfigArray.length) {
      if (firstConfigArray.length === 0) {
        return true;
      } else {
        var dict1 = {};
        var dict2 = {};
        firstConfigArray.forEach(function(config) {
          dict1[config.name] = config.value;
        });
        secondConfigArray.forEach(function(config) {
          dict2[config.name] = config.value;
        });
        for (var key in dict1) {
          if (!dict2[key] || dict1[key] !== dict2[key]) {
            return false;
          }
        }
      }
    } else {
      return false;
    }
    return true;
  }

  function getCookie(name) {
    var parts = document.cookie.split(name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  }

  function showModal(title, message) {
    $('#myModal .modal-header').html('<h4 class="modal-title">' + title + '</h4>');
    $('#myModal .modal-body').html('<p>' + message + '<p>');
    $('#myModal').modal('show');
  }

})(jQuery);
