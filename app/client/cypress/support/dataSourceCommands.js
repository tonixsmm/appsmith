/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable cypress/no-assigning-return-values */

require("cy-verify-downloads").addCustomCommand();
require("cypress-file-upload");
import { ObjectsRegistry } from "../support/Objects/Registry";
const pages = require("../locators/Pages.json");
const datasourceEditor = require("../locators/DatasourcesEditor.json");
const datasourceFormData = require("../fixtures/datasources.json");
const explorer = require("../locators/explorerlocators.json");
const apiWidgetslocator = require("../locators/apiWidgetslocator.json");
const apiEditorLocators = require("../locators/ApiEditor");
const api = require("../locators/AuthenticatedApi.json");

const dataSources = ObjectsRegistry.DataSources;

const backgroundColorBlack = "rgb(0, 0, 0)";
const backgroundColorGray1 = "rgb(250, 250, 250)";
const backgroundColorGray2 = "rgb(240, 240, 240)";
const backgroundColorGray8 = "rgb(113, 110, 110)";

export const initLocalstorage = () => {
  cy.window().then((window) => {
    window.localStorage.setItem("ShowCommentsButtonToolTip", "");
    window.localStorage.setItem("updateDismissed", "true");
  });
};

Cypress.Commands.add("testSaveDeleteDatasource", () => {
  // Instead of deleting the last datasource on the active datasources list,
  // we delete the datasource that was just created (identified by its title)
  cy.get(datasourceEditor.datasourceTitle)
    .invoke("text")
    .then((datasourceTitle) => {
      // test datasource
      cy.get(".t--test-datasource").click();
      cy.wait("@testDatasource");
      // .should("have.nested.property", "response.body.data.success", true)
      //  .debug();

      // save datasource
      cy.get(".t--save-datasource").click();
      cy.wait("@saveDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        201,
      );
      // select datasource to be deleted by datasource title
      cy.contains("EDIT").click();

      // delete datasource
      cy.get(".t--delete-datasource").click();
      cy.get(".t--delete-datasource")
        .contains("Are you sure?")
        .click();
      cy.wait("@deleteDatasource").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
    });
});

Cypress.Commands.add("NavigateToDatasourceEditor", () => {
  cy.get(explorer.addDBQueryEntity)
    .last()
    .click({ force: true });
  cy.get(pages.integrationCreateNew)
    .should("be.visible")
    .click({ force: true });
});

Cypress.Commands.add("NavigateToActiveDatasources", () => {
  cy.get(explorer.addDBQueryEntity)
    .last()
    .click({ force: true });
  cy.get(pages.integrationActiveTab)
    .should("be.visible")
    .click({ force: true });
});

Cypress.Commands.add("testDatasource", (expectedRes = true) => {
  cy.get(".t--test-datasource").click({ force: true });
  cy.wait("@testDatasource").should(
    "have.nested.property",
    "response.body.data.success",
    expectedRes,
  );
});

Cypress.Commands.add("saveDatasource", () => {
  cy.get(".t--save-datasource").click({ force: true });
  cy.wait("@saveDatasource")
    .then((xhr) => {
      cy.log(JSON.stringify(xhr.response.body));
    })
    .should("have.nested.property", "response.body.responseMeta.status", 201);
});

Cypress.Commands.add("testSaveDatasource", (expectedRes = true) => {
  cy.testDatasource(expectedRes);
  cy.saveDatasource();
  // cy.get(datasourceEditor.datasourceCard)
  //   .last()
  //   .click();
});

Cypress.Commands.add("updateDatasource", () => {
  cy.get(".t--save-datasource").click({ force: true });
  cy.wait("@updateDatasource")
    .then((xhr) => {
      cy.log(JSON.stringify(xhr.response.body));
    })
    .should("have.nested.property", "response.body.responseMeta.status", 200);
});

Cypress.Commands.add("testUpdateDatasource", (expectedRes = true) => {
  cy.testDatasource(expectedRes);
  cy.updateDatasource();
  // cy.get(datasourceEditor.datasourceCard)
  //   .last()
  //   .click();
});

Cypress.Commands.add(
  "fillMongoDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["mongo-host"] + "  "
      : datasourceFormData["mongo-host"];
    // const databaseName = shouldAddTrailingSpaces
    //   ? datasourceFormData["mongo-databaseName"] + "  "
    //   : datasourceFormData["mongo-databaseName"];
    cy.get(datasourceEditor["host"]).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["mongo-port"]);
    //cy.get(datasourceEditor["port"]).type(datasourceFormData["mongo-port"]);
    //cy.get(datasourceEditor["selConnectionType"]).click();
    //cy.contains(datasourceFormData["connection-type"]).click();
    //cy.get(datasourceEditor["defaultDatabaseName"]).type(databaseName);//is optional hence removing
    dataSources.ExpandSectionByName(datasourceEditor.sectionAuthentication);
    cy.get(datasourceEditor["databaseName"])
      .clear()
      .type(datasourceFormData["mongo-databaseName"]);
    // cy.get(datasourceEditor["username"]).type(
    //   datasourceFormData["mongo-username"],
    // );
    // cy.get(datasourceEditor["password"]).type(
    //   datasourceFormData["mongo-password"],
    // );
    // cy.get(datasourceEditor["authenticationAuthtype"]).click();
    // cy.contains(datasourceFormData["mongo-authenticationAuthtype"]).click({
    //   force: true,
    // });
  },
);

Cypress.Commands.add(
  "fillPostgresDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["postgres-host"] + "  "
      : datasourceFormData["postgres-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["postgres-databaseName"] + "  "
      : datasourceFormData["postgres-databaseName"];

    cy.get(datasourceEditor.host)
      .clear()
      .type(hostAddress);
    cy.get(datasourceEditor.port)
      .clear()
      .type(datasourceFormData["postgres-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);
    dataSources.ExpandSectionByName(datasourceEditor.sectionAuthentication);
    cy.get(datasourceEditor.username)
      .clear()
      .type(datasourceFormData["postgres-username"]);
    cy.get(datasourceEditor.password)
      .clear()
      .type(datasourceFormData["postgres-password"]);
  },
);

Cypress.Commands.add("fillPostgresDatasourceEnvironmentDetails", () => {
  cy.get(".cs-text:contains('Select a new field')").click({ force: true });
  cy.get("[data-cy='t--dropdown-option-Username']").click({ force: true });
  cy.get('span[name="expand-more"]')
    .last()
    .click({ force: true });
  cy.get("[data-cy='t--dropdown-option-Password']").click({ force: true });
  cy.get('span[name="expand-more"]')
    .last()
    .click({ force: true });
  cy.get("[data-cy='t--dropdown-option-Database Name']").click({ force: true });
  cy.get('span[name="expand-more"]')
    .last()
    .click({ force: true });
  cy.get("[data-cy='t--dropdown-option-SSL Mode']").click({ force: true });
  cy.get('span[name="expand-more"]')
    .last()
    .click({ force: true });
  cy.get("[data-cy='t--dropdown-option-Connection Mode']").click({
    force: true,
  });
  cy.xpath("//input[contains(@name,'host')]").type(
    datasourceFormData["postgres-host"],
  );
  cy.xpath("//input[contains(@name,'port')]").type(
    datasourceFormData["postgres-port"],
  );
  cy.get("[data-cy='database_name.active_env_value']").clear();
  cy.get("[data-cy='database_name.active_env_value']").type(
    datasourceFormData["postgres-databaseName"],
  );
  cy.get("[data-cy='username.active_env_value']").clear();
  cy.get("[data-cy='username.active_env_value']").type(
    datasourceFormData["postgres-username"],
  );
  cy.get("[data-cy='password.active_env_value']").type(
    datasourceFormData["postgres-password"],
  );
  cy.get("a:contains('Bind Values')").click({ force: true });
  cy.wait("@updateEnvironments").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

//To use this method if you have already added Production variable
Cypress.Commands.add("fillPostgresDatasourceEnvironmentDetailsStaging", () => {
  cy.xpath("//input[contains(@name,'host')]").type(
    datasourceFormData["postgres-host"],
  );
  cy.xpath("//input[contains(@name,'port')]").type(
    datasourceFormData["postgres-port"],
  );
  cy.get("[data-cy='username.active_env_value']").clear();
  cy.get("[data-cy='username.active_env_value']").type(
    datasourceFormData["postgres-username"],
  );
  cy.get("[data-cy='password.active_env_value']").type(
    datasourceFormData["postgres-password"],
  );
  cy.get("[data-cy='database_name.active_env_value']").clear();
  cy.get("[data-cy='database_name.active_env_value']").type(
    datasourceFormData["postgres-databaseName"],
  );
  cy.get("a:contains('Bind Values')").click({ force: true });
  cy.wait("@updateEnvironments").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("toggleBetweenEnvironment", (environment) => {
  cy.get(".cs-text:contains('Environment')").click({ multiple: true });
  cy.xpath("//li/a/div[contains(text(),'" + environment + "')]").click({
    force: true,
  });
});

Cypress.Commands.add(
  "fillElasticDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    // we are using postgresql data for elastic search,
    // in the future, this should be changed, just for testing purposes
    const hostAddress = "https://localhost";
    const headerValue = "Bearer Token";

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["postgres-port"]);
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(
      datasourceFormData["postgres-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["postgres-password"],
    );
    cy.get(datasourceEditor.headers).type(headerValue);
  },
);

Cypress.Commands.add(
  "fillMySQLDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["mysql-host"] + "  "
      : datasourceFormData["mysql-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["mysql-databaseName"] + "  "
      : datasourceFormData["mysql-databaseName"];

    cy.get(datasourceEditor.host)
      .clear()
      .type(hostAddress);
    cy.get(datasourceEditor.port)
      .clear()
      .type(datasourceFormData["mysql-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);
    dataSources.ExpandSectionByName(datasourceEditor.sectionAuthentication);
    cy.get(datasourceEditor.username)
      .clear()
      .type(datasourceFormData["mysql-username"]);
    cy.get(datasourceEditor.password)
      .clear()
      .type(datasourceFormData["mysql-password"]);
  },
);

Cypress.Commands.add(
  "fillMsSQLDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["mssql-host"] + "  "
      : datasourceFormData["mssql-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["mssql-databaseName"] + "  "
      : datasourceFormData["mssql-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["mssql-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);
    dataSources.ExpandSectionByName(datasourceEditor.sectionAuthentication);
    cy.get(datasourceEditor.username).type(
      datasourceFormData["mssql-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["mssql-password"],
    );
  },
);

Cypress.Commands.add(
  "fillArangoDBDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["arango-host"] + "  "
      : datasourceFormData["arango-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["arango-databaseName"] + "  "
      : datasourceFormData["arango-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["arango-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);

    dataSources.ExpandSectionByName(datasourceEditor.sectionAuthentication);
    cy.get(datasourceEditor.username).type(
      datasourceFormData["arango-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["arango-password"],
    );
  },
);

Cypress.Commands.add(
  "fillRedshiftDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["redshift-host"] + "  "
      : datasourceFormData["redshift-host"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["redshift-databaseName"] + "  "
      : datasourceFormData["redshift-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["redshift-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);
    dataSources.ExpandSectionByName(datasourceEditor.sectionAuthentication);
    cy.get(datasourceEditor.username).type(
      datasourceFormData["redshift-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["redshift-password"],
    );
  },
);

Cypress.Commands.add(
  "fillUsersMockDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const userMockDatabaseName = shouldAddTrailingSpaces
      ? `${datasourceFormData["mockDatabaseName"] + "    "}`
      : datasourceFormData["mockDatabaseName"];

    const userMockHostAddress = shouldAddTrailingSpaces
      ? `${datasourceFormData["mockHostAddress"] + "    "}`
      : datasourceFormData["mockHostAddress"];

    const userMockDatabaseUsername = shouldAddTrailingSpaces
      ? `${datasourceFormData["mockDatabaseUsername"] + "    "}`
      : datasourceFormData["mockDatabaseUsername"];

    cy.get(datasourceEditor["host"])
      .clear()
      .type(userMockHostAddress);

    cy.get(datasourceEditor["databaseName"])
      .clear()
      .type(userMockDatabaseName);

    cy.get(datasourceEditor["sectionAuthentication"]).click();

    cy.get(datasourceEditor["password"])
      .clear()
      .type(datasourceFormData["mockDatabasePassword"]);

    cy.get(datasourceEditor["username"])
      .clear()
      .type(userMockDatabaseUsername);
  },
);

Cypress.Commands.add(
  "fillSMTPDatasourceForm",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["smtp-host"] + "  "
      : datasourceFormData["smtp-host"];
    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["smtp-port"]);
    cy.get(datasourceEditor.sectionAuthentication).click();
    cy.get(datasourceEditor.username).type(datasourceFormData["smtp-username"]);
    cy.get(datasourceEditor.password).type(datasourceFormData["smtp-password"]);
  },
);

Cypress.Commands.add("createPostgresDatasource", () => {
  cy.NavigateToDatasourceEditor();
  cy.get(datasourceEditor.PostgreSQL).click();
  cy.fillPostgresDatasourceForm();
  cy.testSaveDatasource();
});

// this can be modified further when google sheets automation is done.
Cypress.Commands.add("createGoogleSheetsDatasource", () => {
  cy.NavigateToDatasourceEditor();
  cy.get(datasourceEditor.GoogleSheets).click();
});

Cypress.Commands.add("deleteDatasource", (datasourceName) => {
  cy.NavigateToQueryEditor();
  cy.get(pages.integrationActiveTab)
    .should("be.visible")
    .click({ force: true });
  cy.contains(".t--datasource-name", datasourceName).click();
  cy.get(".t--delete-datasource").click();
  cy.get(".t--delete-datasource")
    .contains("Are you sure?")
    .click();
  cy.wait("@deleteDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("renameDatasource", (datasourceName) => {
  cy.get(".t--edit-datasource-name").click();
  cy.get(".t--edit-datasource-name input")
    .clear()
    .type(datasourceName, { force: true })
    .should("have.value", datasourceName)
    .blur();
});

Cypress.Commands.add("fillAmazonS3DatasourceForm", () => {
  cy.get(datasourceEditor.projectID)
    .clear()
    .type(Cypress.env("S3_ACCESS_KEY"));
  cy.get(datasourceEditor.serviceAccCredential)
    .clear()
    .type(Cypress.env("S3_SECRET_KEY"));
});

Cypress.Commands.add("createAmazonS3Datasource", () => {
  cy.NavigateToDatasourceEditor();
  cy.get(datasourceEditor.AmazonS3).click();
  cy.fillAmazonS3DatasourceForm();
  cy.testSaveDatasource();
});

Cypress.Commands.add("fillMongoDatasourceFormWithURI", () => {
  cy.xpath(datasourceEditor["mongoUriDropdown"])
    .click()
    .wait(500);
  cy.xpath(datasourceEditor["mongoUriYes"])
    .click()
    .wait(500);
  cy.xpath(datasourceEditor["mongoUriInput"]).type(
    datasourceFormData["mongo-uri"],
  );
});

Cypress.Commands.add("ReconnectDatasource", (datasource) => {
  cy.xpath(`//span[text()='${datasource}']`).click();
});

Cypress.Commands.add("createNewAuthApiDatasource", (renameVal) => {
  cy.NavigateToAPI_Panel();
  //Click on Authenticated API
  cy.get(apiWidgetslocator.createAuthApiDatasource).click();
  //Verify weather Authenticated API is successfully created.
  // cy.wait("@saveDatasource").should(
  //   "have.nested.property",
  //   "response.body.responseMeta.status",
  //   201,
  // );
  cy.get(datasourceEditor.datasourceTitleLocator).click();
  cy.get(`${datasourceEditor.datasourceTitleLocator} input`)
    .clear()
    .type(renameVal, { force: true })
    .blur();
  //Fill dummy inputs and save
  cy.fillAuthenticatedAPIForm();
  cy.saveDatasource();
  // Added because api name edit takes some time to
  // reflect in api sidebar after the call passes.
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(2000);
});

Cypress.Commands.add("deleteAuthApiDatasource", (renameVal) => {
  //Navigate to active datasources panel.
  cy.get(pages.addEntityAPI)
    .last()
    .should("be.visible")
    .click({ force: true });
  cy.get(pages.integrationActiveTab)
    .should("be.visible")
    .click({ force: true });
  cy.get("#loading").should("not.exist");
  //Select the datasource to delete
  cy.get(".t--datasource-name")
    .contains(renameVal)
    .click();
  //Click on delete and later confirm
  cy.get(".t--delete-datasource").click();
  cy.get(".t--delete-datasource")
    .contains("Are you sure?")
    .click();
  //Verify the status of deletion
  cy.wait("@deleteDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add("createGraphqlDatasource", (datasourceName) => {
  cy.NavigateToDatasourceEditor();
  //Click on Authenticated Graphql API
  cy.get(apiEditorLocators.createGraphQLDatasource).click({ force: true });
  //Verify weather Authenticated Graphql Datasource is successfully created.
  cy.wait("@saveDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );

  // Change the Graphql Datasource name
  cy.get(".t--edit-datasource-name").click();
  cy.get(".t--edit-datasource-name input")
    .clear()
    .type(datasourceName, { force: true })
    .should("have.value", datasourceName)
    .blur();

  // Adding Graphql Url
  cy.get("input[name='url']").type(datasourceFormData.graphqlApiUrl);

  // save datasource
  cy.get(".t--save-datasource").click({ force: true });
  cy.wait("@saveDatasource").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    201,
  );
});

Cypress.Commands.add("createMockDatasource", (datasourceName) => {
  cy.get(".t--mock-datasource")
    .contains(datasourceName)
    .click();
});

Cypress.Commands.add("datasourceCardContainerStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "min-width", "150px")
    .and("have.css", "border-radius", "4px")
    .and("have.css", "align-items", "center");
});

Cypress.Commands.add("datasourceCardStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "display", "flex")
    .and("have.css", "justify-content", "space-between")
    .and("have.css", "align-items", "center")
    .and("have.css", "height", "64px")
    .realHover()
    .should("have.css", "background-color", backgroundColorGray1)
    .and("have.css", "cursor", "pointer");
});

Cypress.Commands.add("datasourceImageStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "height", "28px")
    .and("have.css", "max-width", "100%");
});

Cypress.Commands.add("datasourceContentWrapperStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "display", "flex")
    .and("have.css", "align-items", "center")
    .and("have.css", "gap", "13px")
    .and("have.css", "padding-left", "13.5px");
});

Cypress.Commands.add("datasourceIconWrapperStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "background-color", backgroundColorGray2)
    .and("have.css", "width", "48px")
    .and("have.css", "height", "48px")
    .and("have.css", "border-radius", "50%")
    .and("have.css", "display", "flex")
    .and("have.css", "align-items", "center");
});

Cypress.Commands.add("datasourceNameStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "color", backgroundColorBlack)
    .and("have.css", "font-size", "16px")
    .and("have.css", "font-weight", "400")
    .and("have.css", "line-height", "24px")
    .and("have.css", "letter-spacing", "-0.24px");
});

Cypress.Commands.add("mockDatasourceDescriptionStyle", (tag) => {
  cy.get(tag)
    .should("have.css", "color", backgroundColorGray8)
    .and("have.css", "font-size", "13px")
    .and("have.css", "font-weight", "400")
    .and("have.css", "line-height", "17px")
    .and("have.css", "letter-spacing", "-0.24px");
});
Cypress.Commands.add(
  "fillPostgresDatasourceFormFat",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["postgres-host-fat"] + "  "
      : datasourceFormData["postgres-host-fat"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["postgres-databaseName"] + "  "
      : datasourceFormData["postgres-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["postgres-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);
    dataSources.ExpandSectionByName(datasourceEditor.sectionAuthentication);
    cy.get(datasourceEditor.username).type(
      datasourceFormData["postgres-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["postgres-password"],
    );
  },
);
Cypress.Commands.add(
  "fillMySQLDatasourceFormFat",
  (shouldAddTrailingSpaces = false) => {
    const hostAddress = shouldAddTrailingSpaces
      ? datasourceFormData["mysql-host-fat"] + "  "
      : datasourceFormData["mysql-host-fat"];
    const databaseName = shouldAddTrailingSpaces
      ? datasourceFormData["mysql-databaseName"] + "  "
      : datasourceFormData["mysql-databaseName"];

    cy.get(datasourceEditor.host).type(hostAddress);
    cy.get(datasourceEditor.port).type(datasourceFormData["mysql-port"]);
    cy.get(datasourceEditor.databaseName)
      .clear()
      .type(databaseName);
    dataSources.ExpandSectionByName(datasourceEditor.sectionAuthentication);
    cy.get(datasourceEditor.username).type(
      datasourceFormData["mysql-username"],
    );
    cy.get(datasourceEditor.password).type(
      datasourceFormData["mysql-password"],
    );
  },
);

Cypress.Commands.add("fillMySQLDatasourceEnvironmentDetails", () => {
  cy.get(".cs-text:contains('Select a new field')").click({ force: true });
  cy.get("[data-cy='t--dropdown-option-Username']").click({ force: true });
  cy.get('span[name="expand-more"]')
    .last()
    .click({ force: true });
  cy.get("[data-cy='t--dropdown-option-Password']").click({ force: true });
  cy.get('span[name="expand-more"]')
    .last()
    .click({ force: true });
  cy.get("[data-cy='t--dropdown-option-Database Name']").click({ force: true });
  cy.get('span[name="expand-more"]')
    .last()
    .click({ force: true });
  cy.get("[data-cy='t--dropdown-option-SSL Mode']").click({ force: true });
  cy.get('span[name="expand-more"]')
    .last()
    .click({ force: true });
  cy.get("[data-cy='t--dropdown-option-Connection Mode']").click({
    force: true,
  });
  cy.xpath("//input[contains(@name,'host')]").type(
    datasourceFormData["mysql-host"],
  );
  cy.xpath("//input[contains(@name,'port')]").type(
    datasourceFormData["mysql-port"],
  );
  cy.get("[data-cy='database_name.active_env_value']").clear();
  cy.get("[data-cy='database_name.active_env_value']").type(
    datasourceFormData["mysql-databaseName"].concat("production"),
  );
  cy.get("[data-cy='username.active_env_value']").clear();
  cy.get("[data-cy='username.active_env_value']").type(
    datasourceFormData["mysql-username"],
  );
  cy.get("[data-cy='password.active_env_value']").type(
    datasourceFormData["mysql-password"],
  );
  cy.get("a:contains('Bind Values')").click({ force: true });
  cy.wait("@updateEnvironments").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

//To use this method if you have already added Production variable for MySQl
Cypress.Commands.add("fillMySQLDatasourceEnvironmentDetailsStaging", () => {
  cy.xpath("//input[contains(@name,'host')]").type(
    datasourceFormData["mysql-host"],
  );
  cy.xpath("//input[contains(@name,'port')]").type(
    datasourceFormData["mysql-port"],
  );
  cy.get("[data-cy='username.active_env_value']").clear();
  cy.get("[data-cy='username.active_env_value']").type(
    datasourceFormData["mysql-username"],
  );
  cy.get("[data-cy='password.active_env_value']").type(
    datasourceFormData["mysql-password"],
  );
  cy.get("[data-cy='database_name.active_env_value']").clear();
  cy.get("[data-cy='database_name.active_env_value']").type(
    datasourceFormData["mysql-databaseName"].concat("staging"),
  );
  cy.get("a:contains('Bind Values')").click({ force: true });
  cy.wait("@updateEnvironments").should(
    "have.nested.property",
    "response.body.responseMeta.status",
    200,
  );
});

Cypress.Commands.add(
  "fillMongoDBDatasourceEnvironmentDetails", () => {
    cy.get(".cs-text:contains('Select a new field')").click({force:true});
    cy.get("[data-cy='t--dropdown-option-Username']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true});
    cy.get("[data-cy='t--dropdown-option-Password']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true});
    cy.get("[data-cy='t--dropdown-option-Database Name']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true});
    cy.get("[data-cy='t--dropdown-option-SSL Mode']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true});
    cy.get("[data-cy='t--dropdown-option-Connection Mode']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true});
    cy.get("[data-cy='t--dropdown-option-Connection Type']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true});
    cy.get("[data-cy='t--dropdown-option-Authentication Type']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true});
    cy.get("[data-cy='t--dropdown-option-Default Database Name']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true});
    cy.get("[data-cy='t--dropdown-option-Connection String URI']").click({force:true});
    cy.get('span[name="expand-more"]').last().click({force: true});
    cy.get("[data-cy='t--dropdown-option-Use Mongo Connection String URI']").click({force:true});



    cy.xpath("//input[contains(@name,'host')]").clear().type(datasourceFormData["mongo-host"]);
    cy.xpath("//input[contains(@name,'port')]").clear().type(datasourceFormData["mongo-port"]);
    cy.get("[data-cy='database_name.active_env_value']").clear();
    cy.get("[data-cy='database_name.active_env_value']").type(
      datasourceFormData["mongo-databaseName"].concat("production"),
    );
    cy.get("[data-cy='username.active_env_value']").clear();
    cy.get("[data-cy='username.active_env_value']").type(
      datasourceFormData["mongo-username"],
    );
    cy.get("[data-cy='password.active_env_value']").clear().type(
      datasourceFormData["mongo-password"],
    );
    cy.get("a:contains('Bind Values')").click({force: true});
    // cy.wait("@updateEnvironments").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );
  }
);

Cypress.Commands.add(
  "fillMongoDatasourceEnvironmentDetailsStaging", () => {
    cy.xpath("//input[contains(@name,'host')]").type(datasourceFormData["mongo-host"]);
    cy.xpath("//input[contains(@name,'port')]").type(datasourceFormData["mongo-port"]);
    cy.get("[data-cy='username.active_env_value']").clear();
    cy.get("[data-cy='username.active_env_value']").type(
      datasourceFormData["mongo-username"],
    );
    cy.get("[data-cy='password.active_env_value']").type(
      datasourceFormData["mongo-password"],
    );
    cy.get("[data-cy='database_name.active_env_value']").clear();
    cy.get("[data-cy='database_name.active_env_value']").type(
      datasourceFormData["mongo-databaseName"].concat("staging"),
    );
    cy.get("a:contains('Bind Values')").click({force: true});
    // cy.wait("@updateEnvironments").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );
  }
);

Cypress.Commands.add(
  "fillAuthenticatedApiEnvironmentDetails", () => {
    cy.get(api.selectNewField).click({force:true});
    cy.get(api.url).click({force:true});
    cy.get(api.urlValue).type("https://example.com")
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.signatureHeader).click();
    cy.get(api.signatureHeaderValue).click();
    cy.get(api.dropDownOption).contains('No').click();
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.signatureKey).click();
    cy.get(api.signatureKeyValue).type("xyz");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.accessToken).click();
    cy.get(api.accessTokenValue).click();
    cy.get(api.dropDownOption).contains('Request Header').click();
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.headerPrefixDropdown).click();
    cy.get(api.headerPrefixValue).type("Bearer");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.clientSecretDropdown).click();
    cy.get(api.clientSecretValue).type("abcd");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.scope).click();
    cy.get(api.scopeValue).type("Read");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.authorizationUrl).click();
    cy.get(api.authorizationUrlValue).type("https://abcd.com");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.resource).click();
    cy.get(api.resourceValue).type("resource");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.username).click();
    cy.get(api.usernameValue).type("user");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.password).click();
    cy.get(api.passwordValue).type("test");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.apiKey).click();
    cy.get(api.apiKeyValue).type("apikey");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.apiValueOption).click();
    cy.get(api.apiValue).type("api value"); 
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.addApiKey).click();
    cy.get(api.addApiKeyValue).click();
    cy.get(api.dropDownOption).contains('Header').click();
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.bearerToken).click();
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.refreshToken).click();
    cy.get(api.refreshTokenValue).click();
    cy.get(api.dropDownOption).contains('No').click();
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.sendCredentials).click();
    cy.get(api.sendCredentialsValue).click();
    cy.get(api.dropDownOption).contains('Body').click();
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.selfSignedCertificate).click();
    cy.get(api.selfSignedCertificateValue).click();
    cy.get(api.dropDownOption).contains('No').click();
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.audience).click();
    cy.get(api.audienceValue).type("audience");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.clientIdDropdown).click();
    cy.get(api.clientIdValue).type("1234");
    cy.get(api.expandMore).last().click({force: true});
    cy.get(api.accessTokenUrlDropdown).click();
    cy.get(api.accessTokenUrlValue).type("https://accesstoken.com");    
  })

  Cypress.Commands.add(
    "fillAuthenticatedApiEnvironmentDetailsStaging", () => {
      cy.get(api.urlValue).type("https://example.com")
      cy.get(api.signatureHeaderValue).click();
      cy.get(api.dropDownOption).contains('No').click();
      cy.get(api.signatureKeyValue).type("xyz");
      cy.get(api.accessTokenValue).click();
      cy.get(api.dropDownOption).contains('Request Header').click();
      cy.get(api.headerPrefixValue).type("Bearer");
      cy.get(api.clientSecretValue).type("abcd");
      cy.get(api.scopeValue).type("Read");
      cy.get(api.authorizationUrlValue).type("https://abcd.com");
      cy.get(api.resourceValue).type("resource");
      cy.get(api.usernameValue).type("user");
      cy.get(api.passwordValue).type("test");
      cy.get(api.apiKeyValue).type("apikey");
      cy.get(api.apiValue).type("api value"); 
      cy.get(api.addApiKeyValue).click();
      cy.get(api.dropDownOption).contains('Header').click();
      cy.get(api.refreshTokenValue).click();
      cy.get(api.dropDownOption).contains('No').click();
      cy.get(api.sendCredentialsValue).click();
      cy.get(api.dropDownOption).contains('Body').click();
      cy.get(api.selfSignedCertificateValue).click();
      cy.get(api.dropDownOption).contains('No').click();
      cy.get(api.audienceValue).type("audience");
      cy.get(api.clientIdValue).type("1234");
      cy.get(api.accessTokenUrlValue).type("https://accesstoken.com");    
    })  

