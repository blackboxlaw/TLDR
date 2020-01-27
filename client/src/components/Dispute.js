import React, { useState, useEffect } from "react";
import { APIClient, Openlaw } from "openlaw";
import {
  Container,
  Loader,
  Button,
  Message,
  Progress
} from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import "openlaw-elements/dist/openlaw-elements.min.css";
import OpenLawForm from "openlaw-elements";

export default function Dispute() {
  const [apiClient, setapiClient] = useState()
  const [state, setState] = useState({
    // Variables for OpenLaw API
    openLawConfig: null,
    templateName: null,

    // State variables for OpenLaw
    title: "",
    template: "",
    compiledTemplate: null,
    parameters: {},
    executionResult: null,
    variables: null
  });

  const openLawConfig = {
    server: process.env.URL,
    templateName: process.env.TEMPLATE_NAME,
    userName: process.env.OPENLAW_USER,
    password: process.env.OPENLAW_PASSWORD
  };

  const instantiateOLClient = async () => {
    const newapiClient = new APIClient(openLawConfig.server);
    newapiClient
      .login(openLawConfig.userName, openLawConfig.password)
      .then(console.log);

    //Retrieve your OpenLaw template by name, use async/await
    const template = await newapiClient.getTemplate(openLawConfig.templateName);
    console.log(template);

    //pull properties off of JSON and make into variables
    const title = template.title;

    //Retreive the OpenLaw Template, including MarkDown
    const content = template.content;
    console.log("template..", template);

    const compiledTemplate = await Openlaw.compileTemplate(content);
    if (compiledTemplate.isError) {
      throw "template error" + compiledTemplate.errorMessage;
    }
    console.log("my compiled template..", compiledTemplate);

    const parameters = {};
    const { executionResult, errorMessage } = await Openlaw.execute(
      compiledTemplate.compiledTemplate,
      {},
      parameters
    );

    const variables = await Openlaw.getExecutedVariables(executionResult, {});
    console.log("variables:", variables);

    setapiClient(newapiClient);
    setState({
      ...state,
      openLawConfig,
      title,
      template,
      compiledTemplate,
      parameters,
      executionResult,
      variables
    });
  };

  useEffect(() => {
    instantiateOLClient();
  }, []);

  const onChange = (key, value) => {
    const parameters = key
      ? {
          ...state.parameters,
          [key]: [key].includes("Email")
            ? JSON.stringify({ email: value })
            : value
        }
      : state.parameters;

    const { executionResult, errorMessage } = Openlaw.execute(
      state.compiledTemplate.compiledTemplate,
      {},
      parameters
    );
    const variables = Openlaw.getExecutedVariables(executionResult, {});
    setState({ ...state, parameters, variables, executionResult });
  };

  return (
    <div className="App">
      {/* <Container>
      <OpenLawForm
          apiClient={apiClient}
          executionResult={state.executionResult}
          parameters={state.parameters}
          onChangeFunction={onChange}
          openLaw={Openlaw}
          variables={state.variables}
        />
      </Container> */}
    </div>
  );
}
