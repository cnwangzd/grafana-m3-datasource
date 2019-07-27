# JSON Datasource - For M³ Platform datasource


## Installation


```
Method 1

Using the `grafana-cli` tool:

grafana-cli plugins install grafana-m3-datasource

brew services restart grafana （ Mac as an eg ）
```

```
Method 2

copy grafana-m3-datasource to /var/lib/grafana/plugins

brew services restart grafana（ Mac as an eg ）
```

## Setup

When adding datasource add your API endpoint to the `URL` field. That's where datasource will make requests to.

![Datasource setup](http://janesware.com/assets/img/grafana-m3-datasource-setup.png)


## Template Variables Setup

Example setup $host
![Variables setup](http://janesware.com/assets/img/grafana-m3-datasource-setup-variables-host.png)

Example setup $inst
![Variables setup](http://janesware.com/assets/img/grafana-m3-datasource-setup-variables-inst.png)

## Dev

```
yarn install ( First time only )

yarn run build

brew services restart grafana（ Mac as an eg ）
```