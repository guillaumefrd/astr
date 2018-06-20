import json
from libastr.logger import get_logger
from libastr.client import AstrClient


# - [ Interface ] ------------------------------------------------------------

class Astr(object):

    def __init__(self):
        self.test = Test
        self.test_subject = TestSubject


# - [ Test ] ----------------------------------------------------------------

class Test(Astr):

    def __init__(self,
                 date,
                 type,
                 configuration,
                 author=None,
                 id=None):
        self.id = id
        self.date = date
        self.type = type
        self.author = author
        self.configuration = configuration

    def __repr__(self):
        return json.dumps(self.__dict__, sort_keys=True, indent=4)

    @staticmethod
    def json_to_object(json):
        configuration = {}
        for config in json["configuration"]:
            configuration[config["name"]] = config["value"]
        return Test(id=json["_id"],
                    author=json["author"],
                    date=json["date"],
                    type=json["type"],
                    configuration=configuration)

    @staticmethod
    def json_to_list_of_object(json):
        test_list = []
        for json_test in json:
            test_list.append(Test.json_to_object(json_test))
        return test_list

    @staticmethod
    def object_to_json(test):
        configuration = []
        for key, value in test.configuration.items():
            configuration.append({"name": key, "value": value})
        test.configuration = configuration
        return test

    @staticmethod
    def get_all():
        return Test.json_to_list_of_object(AstrClient().send_get("tests"))

    @staticmethod
    def get_by_id(id):
        return Test.json_to_object(AstrClient().send_get("tests/id/" + id))

    @staticmethod
    def get_by_mongodb_query(query):
        return Test.json_to_list_of_object(AstrClient().send_post("tests", params=query))

    @staticmethod
    def get_by_args(author=None, date=None, type=None, configuration=None):
        query = {}
        if author is not None:
            query["author"] = author
        if date is not None:
            query["date"] = date
        if type is not None:
            query["type"] = type
        if configuration is not None:
            config_list = []
            for key, value in configuration.items():
                config_list.append({
                    "configuration": {
                        "$elemMatch": {
                            "name": key,
                            "value": value
                        }
                    }
                })
            query["$and"] = config_list
        return Test.get_by_mongodb_query(query)

    @staticmethod
    def delete_by_id(id):
        return AstrClient().send_delete("tests/id/" + id)

    @staticmethod
    def update_by_id(id, date=None, configuration=None):
        body_request = {}
        if date is not None:
            body_request["date"] = date
        if configuration is not None:
            config_list = []
            for key, value in configuration.items():
                config_list.append({"name": key, "value": value})
            body_request["configuration"] = config_list
        return AstrClient().send_post("tests/id/" + id, params=body_request)

    @staticmethod
    def get_all_configurations():
        return AstrClient().send_get("tests/configurations")

    @staticmethod
    def get_configurations_of_test_subject(test_subject):
        return AstrClient().send_get("tests/configurations/" + test_subject)

    @staticmethod
    def archive(date, type, configuration, paths):
        test = Test(date=date, type=type, configuration=configuration)
        test = Test.object_to_json(test)
        test.author = AstrClient().get_username()
        res = AstrClient().send_post("tests/add", params=test.__dict__)
        if res["name"] == "Failed":
            return res
        else:
            test_id = res['test']['_id']
            return AstrClient().upload(uri="upload", paths=paths, archive_name=test_id)

    @staticmethod
    def download_by_id(id, path):
        if not path.endswith('/'):
            path += '/'
        path += id + '.zip'
        res = AstrClient().download(uri="download/id/" + id, path=path)
        if res is True:
            return "Downloaded: {}".format(path)
        else:
            return "Error while downloading {}".format(id)


class TestSubject(Astr):

    def __init__(self,
                 id,
                 name,
                 author,
                 configuration):
        self.id = id
        self.name = name
        self.author = author
        self.configuration = configuration

    def __repr__(self):
        return json.dumps(self.__dict__, sort_keys=True, indent=4)

    @staticmethod
    def json_to_object(json):
        configuration = {}
        for config in json["configuration"]:
            configuration[config["name"]] = config["options"]
        return TestSubject(id=json["_id"],
                           name=json["name"],
                           author=json["author"],
                           configuration=configuration)

    @staticmethod
    def json_to_list_of_object(json):
        test_subject_list = []
        for json_test_subject in json:
            test_subject_list.append(TestSubject.json_to_object(json_test_subject))
        return test_subject_list

    @staticmethod
    def get_all():
        return TestSubject.json_to_list_of_object(AstrClient().send_get("test-subjects"))

    @staticmethod
    def get_by_id(id):
        return TestSubject.json_to_object(AstrClient().send_get("test-subjects/id/" + id))

    @staticmethod
    def get_by_name(name):
        return TestSubject.json_to_object(AstrClient().send_get("test-subjects/name/" + name))

    @staticmethod
    def get_options_of_configuration(test_subject_name, configuration_name):
        return AstrClient().send_get("test-subjects/options/{}/{}".format(test_subject_name, configuration_name))
